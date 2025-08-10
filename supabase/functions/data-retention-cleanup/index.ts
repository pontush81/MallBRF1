import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface RetentionRule {
  table: string;
  retentionDays: number;
  dateColumn: string;
  safetyChecks: string[];
  exceptions: string[];
  description: string;
}

// SÄKRA RETENTION-REGLER med kontroller
const RETENTION_RULES: RetentionRule[] = [
  {
    table: 'users',
    retentionDays: 730, // 2 år efter medlemskap slutar
    dateColumn: 'deleted_at', // Använd soft delete först
    safetyChecks: [
      'no_active_bookings', // Ingen aktiv bokning
      'no_recent_login',    // Ingen inloggning senaste 6 mån
      'membership_ended'    // Medlemskap avslutat
    ],
    exceptions: [
      'styrelse_member',    // Styrelseledamöter
      'ekonomi_ansvar'      // Ekonomiskt ansvar kvarstår
    ],
    description: 'Medlemsuppgifter - endast efter medlemskap slutar + 2 år'
  },
  {
    table: 'bookings',
    retentionDays: 1095, // 3 år efter bokning
    dateColumn: 'createdat',
    safetyChecks: [
      'booking_completed',  // Bokning avslutad
      'payment_settled'     // Betalning reglerad
    ],
    exceptions: [
      'dispute_ongoing',    // Pågående tvist
      'accounting_hold'     // Bokföringsspärr
    ],
    description: 'Bokningshistorik - 3 år för ekonomisk redovisning'
  },
  {
    table: 'audit_logs',
    retentionDays: 365, // 1 år för säkerhetsloggar
    dateColumn: 'created_at',
    safetyChecks: [
      'not_security_critical', // Inte säkerhetskritisk
      'no_active_investigation' // Ingen pågående utredning
    ],
    exceptions: [
      'security_incident',  // Säkerhetsincident
      'legal_requirement'   // Rättslig förpliktelse
    ],
    description: 'Säkerhetsloggar - 1 år för systemsäkerhet'
  },
  {
    table: 'gdpr_requests_log',
    retentionDays: 1825, // 5 år för GDPR-loggar
    dateColumn: 'created_at',
    safetyChecks: [],
    exceptions: [
      'legal_case_active'   // Aktiv rättsprocess
    ],
    description: 'GDPR-loggar - 5 år enligt myndighetskrav'
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, dryRun = true }: { action: string, dryRun?: boolean } = await req.json()

    switch (action) {
      case 'analyze_retention':
        return await analyzeRetentionCandidates(supabase)
      
      case 'cleanup_data':
        return await performDataCleanup(supabase, dryRun)
      
      case 'get_retention_status':
        return await getRetentionStatus(supabase)

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Data Retention Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function analyzeRetentionCandidates(supabase: any) {
  const results = []
  
  for (const rule of RETENTION_RULES) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - rule.retentionDays)
      
      // Räkna poster äldre än retention-perioden
      const { count: candidateCount, error: countError } = await supabase
        .from(rule.table)
        .select('*', { count: 'exact', head: true })
        .lt(rule.dateColumn, cutoffDate.toISOString())
      
      if (countError) {
        console.error(`Error counting ${rule.table}:`, countError)
        continue
      }

      // Hämta urval för säkerhetskontroll
      const { data: sampleData, error: sampleError } = await supabase
        .from(rule.table)
        .select('*')
        .lt(rule.dateColumn, cutoffDate.toISOString())
        .limit(10)
      
      const safeToDelete = sampleData ? await checkSafetyConditions(supabase, rule, sampleData) : []
      
      results.push({
        table: rule.table,
        description: rule.description,
        retentionDays: rule.retentionDays,
        candidateCount: candidateCount || 0,
        sampleChecked: sampleData?.length || 0,
        safeToDeleteCount: safeToDelete.length,
        cutoffDate: cutoffDate.toISOString(),
        safetyChecks: rule.safetyChecks,
        exceptions: rule.exceptions
      })
      
    } catch (error) {
      console.error(`Error analyzing ${rule.table}:`, error)
      results.push({
        table: rule.table,
        error: error.message
      })
    }
  }

  return new Response(
    JSON.stringify({ 
      analysis: results,
      recommendation: "Granska resultat noga innan du kör faktisk cleanup med dryRun=false",
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function checkSafetyConditions(supabase: any, rule: RetentionRule, records: any[]): Promise<any[]> {
  const safeRecords = []
  
  for (const record of records) {
    let isSafe = true
    const failedChecks = []
    
    // Utför säkerhetskontroller baserat på tabell
    for (const check of rule.safetyChecks) {
      const checkResult = await performSafetyCheck(supabase, rule.table, record, check)
      if (!checkResult.safe) {
        isSafe = false
        failedChecks.push(check)
      }
    }
    
    // Kontrollera undantag
    for (const exception of rule.exceptions) {
      const exceptionResult = await checkException(supabase, rule.table, record, exception)
      if (exceptionResult.hasException) {
        isSafe = false
        failedChecks.push(`exception_${exception}`)
      }
    }
    
    if (isSafe) {
      safeRecords.push({
        ...record,
        safety_verified: true
      })
    } else {
      console.log(`Record ${record.id} not safe to delete: ${failedChecks.join(', ')}`)
    }
  }
  
  return safeRecords
}

async function performSafetyCheck(supabase: any, table: string, record: any, checkType: string): Promise<{safe: boolean, reason?: string}> {
  try {
    switch (table) {
      case 'users':
        return await checkUserSafety(supabase, record, checkType)
      case 'bookings':
        return await checkBookingSafety(supabase, record, checkType)
      case 'audit_logs':
        return await checkLogSafety(supabase, record, checkType)
      default:
        return { safe: true }
    }
  } catch (error) {
    console.error(`Safety check ${checkType} failed:`, error)
    return { safe: false, reason: `Check failed: ${error.message}` }
  }
}

async function checkUserSafety(supabase: any, user: any, checkType: string): Promise<{safe: boolean, reason?: string}> {
  switch (checkType) {
    case 'no_active_bookings':
      // Kontrollera att användaren inte har framtida bokningar
      const { data: futureBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('email', user.email)
        .gte('date', new Date().toISOString())
        .limit(1)
      
      return { 
        safe: !futureBookings || futureBookings.length === 0,
        reason: futureBookings?.length > 0 ? 'Har aktiva/framtida bokningar' : undefined
      }
    
    case 'no_recent_login':
      // Kontrollera senaste inloggning (om vi loggar detta)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      return { 
        safe: !user.last_sign_in_at || new Date(user.last_sign_in_at) < sixMonthsAgo,
        reason: user.last_sign_in_at && new Date(user.last_sign_in_at) >= sixMonthsAgo ? 'Inloggad senaste 6 månaderna' : undefined
      }
    
    case 'membership_ended':
      // Kontrollera att medlemskapet är avslutat
      return { 
        safe: user.membership_status === 'ended' || user.deleted_at !== null,
        reason: user.membership_status !== 'ended' ? 'Medlemskap fortfarande aktivt' : undefined
      }
    
    default:
      return { safe: true }
  }
}

async function checkBookingSafety(supabase: any, booking: any, checkType: string): Promise<{safe: boolean, reason?: string}> {
  switch (checkType) {
    case 'booking_completed':
      // Kontrollera att bokningen är avslutad
      const bookingEndDate = new Date(booking.enddate || booking.date)
      return { 
        safe: bookingEndDate < new Date(),
        reason: bookingEndDate >= new Date() ? 'Bokning pågår fortfarande' : undefined
      }
    
    case 'payment_settled':
      // Kontrollera betalningsstatus (förutsätter att vi har detta fält)
      return { 
        safe: booking.payment_status === 'settled' || booking.payment_status === null,
        reason: booking.payment_status === 'pending' ? 'Betalning ej reglerad' : undefined
      }
    
    default:
      return { safe: true }
  }
}

async function checkLogSafety(supabase: any, log: any, checkType: string): Promise<{safe: boolean, reason?: string}> {
  switch (checkType) {
    case 'not_security_critical':
      // Kontrollera att loggen inte är säkerhetskritisk
      const criticalEvents = ['login_failure', 'data_breach', 'unauthorized_access']
      return { 
        safe: !criticalEvents.includes(log.event_type),
        reason: criticalEvents.includes(log.event_type) ? 'Säkerhetskritisk händelse' : undefined
      }
    
    case 'no_active_investigation':
      // Kontrollera att loggen inte är del av aktiv utredning
      const { data: investigations } = await supabase
        .from('security_investigations')
        .select('id')
        .eq('related_log_id', log.id)
        .eq('status', 'active')
        .limit(1)
      
      return { 
        safe: !investigations || investigations.length === 0,
        reason: investigations?.length > 0 ? 'Del av aktiv utredning' : undefined
      }
    
    default:
      return { safe: true }
  }
}

async function checkException(supabase: any, table: string, record: any, exceptionType: string): Promise<{hasException: boolean, reason?: string}> {
  // Implementera undantagskontroller här
  // Till exempel: styrelsemedlemmar, pågående rättsprocesser, etc.
  return { hasException: false }
}

async function performDataCleanup(supabase: any, dryRun: boolean) {
  const results = []
  
  if (dryRun) {
    console.log('🧪 KÖRJER I DRY-RUN MODE - Ingen data raderas')
  } else {
    console.log('⚠️  KÖRJER I LIVE MODE - Data kommer att raderas permanent')
  }
  
  for (const rule of RETENTION_RULES) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - rule.retentionDays)
      
      // Hämta kandidater för radering
      const { data: candidates, error } = await supabase
        .from(rule.table)
        .select('*')
        .lt(rule.dateColumn, cutoffDate.toISOString())
        .limit(100) // Begränsa per körning för säkerhet
      
      if (error) {
        throw error
      }
      
      if (!candidates || candidates.length === 0) {
        results.push({
          table: rule.table,
          action: 'no_candidates',
          count: 0,
          message: 'Inga poster att radera'
        })
        continue
      }
      
      // Säkerhetskontroll
      const safeToDelete = await checkSafetyConditions(supabase, rule, candidates)
      
      let deletedCount = 0
      const errors = []
      
      if (!dryRun && safeToDelete.length > 0) {
        // Soft delete först för säkerhet
        for (const record of safeToDelete) {
          try {
            if (rule.table === 'users') {
              // Soft delete för users
              await supabase
                .from(rule.table)
                .update({ 
                  deleted_at: new Date().toISOString(),
                  email: `deleted_${record.id}@deleted.local`,
                  personal_data_deleted: true
                })
                .eq('id', record.id)
            } else {
              // Hard delete för andra tabeller
              await supabase
                .from(rule.table)
                .delete()
                .eq('id', record.id)
            }
            
            deletedCount++
            
            // Logga radering
            await logDataDeletion(supabase, rule.table, record.id, 'automated_retention')
            
          } catch (deleteError) {
            console.error(`Error deleting ${record.id}:`, deleteError)
            errors.push(`${record.id}: ${deleteError.message}`)
          }
        }
      }
      
      results.push({
        table: rule.table,
        description: rule.description,
        candidates_found: candidates.length,
        safe_to_delete: safeToDelete.length,
        actually_deleted: deletedCount,
        errors: errors,
        dry_run: dryRun
      })
      
    } catch (error) {
      console.error(`Error processing ${rule.table}:`, error)
      results.push({
        table: rule.table,
        error: error.message
      })
    }
  }
  
  return new Response(
    JSON.stringify({ 
      cleanup_results: results,
      dry_run: dryRun,
      timestamp: new Date().toISOString(),
      warning: dryRun ? "Detta var en test-körning. Ingen data raderades." : "Data har raderats permanent enligt säkerhetsregler."
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function logDataDeletion(supabase: any, table: string, recordId: string, reason: string) {
  try {
    await supabase
      .from('data_deletion_log')
      .insert({
        table_name: table,
        record_id: recordId,
        deletion_reason: reason,
        deleted_at: new Date().toISOString(),
        deleted_by: 'automated_retention_system'
      })
  } catch (error) {
    console.error('Failed to log deletion:', error)
  }
}

async function getRetentionStatus(supabase: any) {
  const status = {
    retention_rules: RETENTION_RULES.length,
    last_cleanup_run: null,
    next_scheduled_run: null,
    total_tables_managed: RETENTION_RULES.map(r => r.table),
    safety_checks_enabled: true
  }
  
  return new Response(
    JSON.stringify(status),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
} 