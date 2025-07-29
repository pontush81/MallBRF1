import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BreachNotification {
  incident_id: string;
  type: 'confidentiality' | 'integrity' | 'availability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_systems: string[];
  affected_data_types: string[];
  estimated_records: number;
  description: string;
  discovery_time: string;
  reporter_email: string;
  preliminary_assessment: string;
}

interface NotificationRecipient {
  name: string;
  email: string;
  role: string;
  notification_method: 'email' | 'sms' | 'both';
}

// Incident Response Team kontakter
const INCIDENT_TEAM: NotificationRecipient[] = [
  {
    name: 'BRF Gulmåran',
    email: 'gulmaranbrf@gmail.com',
    role: 'Incident Commander',
    notification_method: 'both'
  },
  {
    name: 'Styrelseordförande',
    email: 'styrelse@brfgulmaran.se',
    role: 'Communications Lead',
    notification_method: 'email'
  }
];

// IMY kontaktuppgifter
const IMY_CONTACT = {
  email: 'datainspektionen@imy.se',
  phone: '08-657 61 00'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...requestData } = await req.json()

    switch (action) {
      case 'report_incident':
        return await handleIncidentReport(supabase, requestData as BreachNotification)
      
      case 'assess_risk':
        return await handleRiskAssessment(supabase, requestData)
      
      case 'notify_authorities':
        return await handleAuthorityNotification(supabase, requestData)
      
      case 'notify_data_subjects':
        return await handleDataSubjectNotification(supabase, requestData)
        
      case 'get_incident_status':
        return await getIncidentStatus(supabase, requestData.incident_id)

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action specified' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Breach Notification Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleIncidentReport(supabase: any, notification: BreachNotification) {
  try {
    console.log(`🚨 NEW BREACH REPORT: ${notification.incident_id}`)
    
    // 1. Logga incident i databas
    const { data: incident, error: insertError } = await supabase
      .from('security_incidents')
      .insert({
        incident_id: notification.incident_id,
        type: notification.type,
        severity: notification.severity,
        affected_systems: notification.affected_systems,
        affected_data_types: notification.affected_data_types,
        estimated_records: notification.estimated_records,
        description: notification.description,
        discovery_time: notification.discovery_time,
        reporter_email: notification.reporter_email,
        status: 'reported',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to log incident: ${insertError.message}`)
    }

    // 2. Omedelbar riskbedömning
    const riskLevel = assessInitialRisk(notification)
    
    // 3. Aktivera incident response team
    await notifyIncidentTeam(notification, riskLevel)
    
    // 4. Starta automatiska processflöden baserat på risk
    if (riskLevel === 'high' || riskLevel === 'critical') {
      // Omedelbar eskalering för högrisk-incidenter
      await escalateToAuthorities(supabase, notification)
    }
    
    // 5. Sätt timer för 72-timmarsgräns för IMY-anmälan
    await scheduleAuthorityNotification(supabase, notification.incident_id)
    
    return new Response(
      JSON.stringify({
        success: true,
        incident_id: notification.incident_id,
        risk_level: riskLevel,
        message: 'Incident report received and response activated',
        next_steps: getNextStepsForRisk(riskLevel)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error handling incident report:', error)
    throw error
  }
}

async function handleRiskAssessment(supabase: any, data: any) {
  try {
    const { incident_id, assessment_details } = data
    
    // Uppdatera incident med detaljerad riskbedömning
    const { error: updateError } = await supabase
      .from('security_incidents')
      .update({
        risk_assessment: assessment_details,
        status: 'assessed',
        assessed_at: new Date().toISOString()
      })
      .eq('incident_id', incident_id)

    if (updateError) {
      throw new Error(`Failed to update risk assessment: ${updateError.message}`)
    }

    // Beslut om myndighetskontakt behövs
    const requiresAuthorityNotification = assessment_details.risk_score >= 3 || 
                                         assessment_details.affects_sensitive_data ||
                                         assessment_details.estimated_records > 100

    return new Response(
      JSON.stringify({
        success: true,
        incident_id,
        requires_authority_notification: requiresAuthorityNotification,
        requires_data_subject_notification: assessment_details.high_risk_to_individuals,
        recommended_actions: generateRecommendedActions(assessment_details)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in risk assessment:', error)
    throw error
  }
}

async function handleAuthorityNotification(supabase: any, data: any) {
  try {
    const { incident_id, notification_details } = data
    
    // Skapa IMY-anmälan
    const imyReport = await generateIMYReport(supabase, incident_id, notification_details)
    
    // Skicka via e-post till IMY
    await sendEmailNotification({
      to: IMY_CONTACT.email,
      subject: `PERSONUPPGIFTSINCIDENT - BRF Gulmåran - ${incident_id}`,
      body: imyReport,
      urgent: true
    })
    
    // Logga anmälan
    const { error: logError } = await supabase
      .from('security_incidents')
      .update({
        authority_notified_at: new Date().toISOString(),
        authority_notification_details: notification_details,
        status: 'authority_notified'
      })
      .eq('incident_id', incident_id)

    if (logError) {
      console.error('Failed to log authority notification:', logError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        incident_id,
        message: 'Authority notification sent to IMY',
        notification_time: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error notifying authorities:', error)
    throw error
  }
}

async function handleDataSubjectNotification(supabase: any, data: any) {
  try {
    const { incident_id, affected_emails, notification_message } = data
    
    // Hämta incident details
    const { data: incident, error: fetchError } = await supabase
      .from('security_incidents')
      .select('*')
      .eq('incident_id', incident_id)
      .single()

    if (fetchError || !incident) {
      throw new Error('Incident not found')
    }

    // Skicka personalized notifications till påverkade användare
    const notificationResults = await Promise.allSettled(
      affected_emails.map(async (email: string) => {
        return sendDataSubjectNotification({
          email,
          incident_id,
          incident_type: incident.type,
          notification_message,
          contact_info: 'gulmaranbrf@gmail.com'
        })
      })
    )

    // Räkna framgångsrika notifikationer
    const successful = notificationResults.filter(result => result.status === 'fulfilled').length
    const failed = notificationResults.length - successful

    // Uppdatera incident status
    const { error: updateError } = await supabase
      .from('security_incidents')
      .update({
        data_subjects_notified_at: new Date().toISOString(),
        data_subjects_notification_count: successful,
        data_subjects_notification_failures: failed,
        status: failed === 0 ? 'data_subjects_notified' : 'data_subjects_partially_notified'
      })
      .eq('incident_id', incident_id)

    if (updateError) {
      console.error('Failed to update data subject notification status:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        incident_id,
        notifications_sent: successful,
        notifications_failed: failed,
        message: `Data subject notifications completed: ${successful}/${notificationResults.length}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error notifying data subjects:', error)
    throw error
  }
}

async function getIncidentStatus(supabase: any, incident_id: string) {
  try {
    const { data: incident, error } = await supabase
      .from('security_incidents')
      .select('*')
      .eq('incident_id', incident_id)
      .single()

    if (error || !incident) {
      return new Response(
        JSON.stringify({ error: 'Incident not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Beräkna time till deadlines
    const discoveryTime = new Date(incident.discovery_time)
    const now = new Date()
    const hoursElapsed = Math.floor((now.getTime() - discoveryTime.getTime()) / (1000 * 60 * 60))
    
    const timeToIMYDeadline = Math.max(0, 72 - hoursElapsed)
    const timeToDataSubjectDeadline = Math.max(0, 72 - hoursElapsed) // Same for now, but could be different

    return new Response(
      JSON.stringify({
        incident,
        timeline: {
          hours_elapsed: hoursElapsed,
          time_to_imy_deadline_hours: timeToIMYDeadline,
          time_to_data_subject_deadline_hours: timeToDataSubjectDeadline,
          imy_deadline_passed: timeToIMYDeadline === 0,
          data_subject_deadline_passed: timeToDataSubjectDeadline === 0
        },
        compliance_status: {
          authority_notification_required: shouldNotifyAuthority(incident),
          authority_notification_completed: !!incident.authority_notified_at,
          data_subject_notification_required: shouldNotifyDataSubjects(incident),
          data_subject_notification_completed: !!incident.data_subjects_notified_at
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error getting incident status:', error)
    throw error
  }
}

// Helper functions

function assessInitialRisk(notification: BreachNotification): string {
  let riskScore = 0

  // Severity scoring
  const severityScores = { low: 1, medium: 2, high: 3, critical: 4 }
  riskScore += severityScores[notification.severity]

  // Data type scoring
  const sensitiveDataTypes = ['personal_id', 'financial', 'health', 'biometric']
  const hasSensitiveData = notification.affected_data_types.some(type => 
    sensitiveDataTypes.includes(type))
  if (hasSensitiveData) riskScore += 2

  // Volume scoring
  if (notification.estimated_records > 1000) riskScore += 2
  else if (notification.estimated_records > 100) riskScore += 1

  // System criticality scoring
  const criticalSystems = ['auth', 'database', 'payment']
  const hasCriticalSystems = notification.affected_systems.some(system => 
    criticalSystems.includes(system))
  if (hasCriticalSystems) riskScore += 1

  // Convert score to risk level
  if (riskScore >= 7) return 'critical'
  if (riskScore >= 5) return 'high'
  if (riskScore >= 3) return 'medium'
  return 'low'
}

async function notifyIncidentTeam(notification: BreachNotification, riskLevel: string) {
  const notifications = INCIDENT_TEAM.map(async (member) => {
    const subject = `🚨 SÄKERHETSINCIDENT - ${riskLevel.toUpperCase()} RISK - ${notification.incident_id}`
    const body = `
SÄKERHETSINCIDENT RAPPORTERAD

Incident ID: ${notification.incident_id}
Risknivå: ${riskLevel.toUpperCase()}
Typ: ${notification.type}
Upptäckt: ${notification.discovery_time}

PÅVERKADE SYSTEM:
${notification.affected_systems.join(', ')}

PÅVERKADE DATATYPER:
${notification.affected_data_types.join(', ')}

UPPSKATTADE POSTER: ${notification.estimated_records}

BESKRIVNING:
${notification.description}

OMEDELBARA ÅTGÄRDER:
${getNextStepsForRisk(riskLevel).join('\n')}

---
Detta meddelande är automatiskt genererat av Breach Notification System.
För frågor kontakta Incident Commander: gulmaranbrf@gmail.com
`

    return sendEmailNotification({
      to: member.email,
      subject,
      body,
      urgent: riskLevel === 'high' || riskLevel === 'critical'
    })
  })

  await Promise.allSettled(notifications)
}

async function escalateToAuthorities(supabase: any, notification: BreachNotification) {
  // För kritiska incidenter - omedelbar kontakt med IMY
  const urgentNotification = `
BRÅDSKANDE SÄKERHETSINCIDENT - OMEDELBAR ÅTGÄRD KRÄVS

Incident ID: ${notification.incident_id}
Organisation: BRF Gulmåran
Kontakt: gulmaranbrf@gmail.com

PRELIMINARY ASSESSMENT:
- Typ: ${notification.type}
- Allvarlighetsgrad: ${notification.severity}
- Uppskattade påverkade poster: ${notification.estimated_records}
- Påverkade system: ${notification.affected_systems.join(', ')}

Vi kommer att följa upp med fullständig anmälan inom 72 timmar.

Med vänliga hälsningar,
BRF Gulmåran Incident Response Team
`

  await sendEmailNotification({
    to: IMY_CONTACT.email,
    subject: `BRÅDSKANDE PERSONUPPGIFTSINCIDENT - ${notification.incident_id}`,
    body: urgentNotification,
    urgent: true
  })
}

async function scheduleAuthorityNotification(supabase: any, incident_id: string) {
  // Sätt en reminder för 60 timmar (12 timmar före deadline)
  const reminderTime = new Date()
  reminderTime.setHours(reminderTime.getHours() + 60)

  await supabase
    .from('scheduled_notifications')
    .insert({
      incident_id,
      notification_type: 'authority_deadline_reminder',
      scheduled_for: reminderTime.toISOString(),
      status: 'pending'
    })
}

function getNextStepsForRisk(riskLevel: string): string[] {
  const baseSteps = [
    '1. Aktivera incident response team',
    '2. Genomför detaljerad riskbedömning',
    '3. Dokumentera alla åtgärder'
  ]

  if (riskLevel === 'high' || riskLevel === 'critical') {
    return [
      ...baseSteps,
      '4. Överväg omedelbar myndighetskontakt',
      '5. Förbered kommunikation till berörda personer',
      '6. Isolera påverkade system',
      '7. Säkra forensisk bevisning'
    ]
  }

  if (riskLevel === 'medium') {
    return [
      ...baseSteps,
      '4. Planera myndighetskontakt inom 72 timmar',
      '5. Utvärdera behov av personnotifikation'
    ]
  }

  return [
    ...baseSteps,
    '4. Överväg om myndighetskontakt krävs',
    '5. Fortsätt övervakning'
  ]
}

async function generateIMYReport(supabase: any, incident_id: string, details: any): Promise<string> {
  const { data: incident } = await supabase
    .from('security_incidents')
    .select('*')
    .eq('incident_id', incident_id)
    .single()

  return `
PERSONUPPGIFTSINCIDENT ENLIGT GDPR ARTIKEL 33
BRF Gulmåran

1. PERSONUPPGIFTSANSVARIG
Organisation: BRF Gulmåran
      Kontaktperson: BRF Gulmåran
      E-post: gulmaranbrf@gmail.com
  E-post (allmän): gulmaranbrf@gmail.com
  Adress: Köpmansgatan 80, 269 31 Båstad

2. INCIDENT
Incident ID: ${incident_id}
Tidpunkt för intrång: ${incident.discovery_time}
Upptäckt: ${incident.created_at}
Typ av intrång: ${incident.type}

3. BESKRIVNING AV INTRÅNGET
${incident.description}

${details.detailed_description || ''}

4. PÅVERKADE PERSONUPPGIFTER
Kategorier av registrerade: ${details.affected_categories || 'Medlemmar i BRF Gulmåran'}
Kategorier av personuppgifter: ${incident.affected_data_types.join(', ')}
Uppskattade antal registrerade: ${incident.estimated_records}

5. SANNOLIKA KONSEKVENSER
${details.likely_consequences || 'Bedömning pågår'}

6. VIDTAGNA ÅTGÄRDER
${details.remedial_actions || 'Omedelbar isolering av påverkade system, löpande incident response'}

7. PLANERADE ÅTGÄRDER
${details.planned_actions || 'Fullständig säkerhetsgenomgång, förstärkta säkerhetsåtgärder'}

Med vänliga hälsningar,
Pontus Hörberg
BRF Gulmåran
`
}

async function sendEmailNotification(params: {
  to: string,
  subject: string,
  body: string,
  urgent?: boolean
}) {
  // Här skulle normalt integration med e-posttjänst vara
  // För demo-syfte loggar vi meddelandet
  console.log(`📧 EMAIL NOTIFICATION ${params.urgent ? '(URGENT)' : ''}`)
  console.log(`To: ${params.to}`)
  console.log(`Subject: ${params.subject}`)
  console.log(`Body: ${params.body}`)
  
  // I verkligheten skulle detta vara t.ex. SendGrid, SES, eller liknande
  return { success: true, message_id: `msg_${Date.now()}` }
}

async function sendDataSubjectNotification(params: {
  email: string,
  incident_id: string,
  incident_type: string,
  notification_message: string,
  contact_info: string
}) {
  const subject = `Viktig information om datasäkerhet - BRF Gulmåran`
  const body = `
Kära medlem,

Vi informerar dig om en säkerhetsincident som kan ha påverkat dina personuppgifter.

${params.notification_message}

ÅTGÄRDER VI HAR VIDTAGIT:
Vi har omedelbart vidtagit åtgärder för att stoppa incidenten och säkra våra system.

VAD KAN DU GÖRA:
- Övervaka dina konton för onormal aktivitet
- Kontakta oss om du märker något ovanligt
- Läs mer på vår webbplats om säkerhetsåtgärder

Vi har anmält incidenten till Integritetsskyddsmyndigheten (IMY) enligt GDPR.

För frågor kontakta oss på: ${params.contact_info}

Med vänliga hälsningar,
Styrelsen BRF Gulmåran

Incident referens: ${params.incident_id}
`

  return sendEmailNotification({
    to: params.email,
    subject,
    body,
    urgent: false
  })
}

function shouldNotifyAuthority(incident: any): boolean {
  return incident.severity === 'high' || 
         incident.severity === 'critical' || 
         incident.estimated_records > 100 ||
         incident.affected_data_types.some((type: string) => 
           ['personal_id', 'financial', 'health'].includes(type))
}

function shouldNotifyDataSubjects(incident: any): boolean {
  return incident.severity === 'high' || 
         incident.severity === 'critical' ||
         (incident.risk_assessment && incident.risk_assessment.high_risk_to_individuals)
}

function generateRecommendedActions(assessment: any): string[] {
  const actions = ['Dokumentera fullständig incident timeline']
  
  if (assessment.requires_authority_notification) {
    actions.push('Förbered anmälan till IMY')
  }
  
  if (assessment.high_risk_to_individuals) {
    actions.push('Förbered kommunikation till berörda personer')
  }
  
  if (assessment.ongoing_threat) {
    actions.push('Förstärk säkerhetsövervakning')
  }
  
  return actions
} 