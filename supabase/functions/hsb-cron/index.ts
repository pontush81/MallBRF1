import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// This function is triggered by pg_cron on the 1st of each month at 08:00 UTC.
// It reads configuration from hsb_report_schedule, determines if a report
// should be sent (monthly: always, quarterly: only Jan/Apr/Jul/Oct),
// and calls hsb-form-v2 to generate + email the PDF report.

Deno.serve(async (req) => {
  try {
    console.log('🕐 HSB Cron job triggered');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Read active schedules
    const { data: schedules, error: scheduleError } = await supabase
      .from('hsb_report_schedule')
      .select('*')
      .eq('is_active', true);

    if (scheduleError) {
      console.error('❌ Error reading schedules:', scheduleError);
      throw scheduleError;
    }

    if (!schedules || schedules.length === 0) {
      console.log('ℹ️ No active schedules found, skipping');
      return new Response(JSON.stringify({ message: 'No active schedules' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-indexed
    const currentYear = now.getFullYear();

    // Quarterly months: reports are sent in Jan (Q4 of prev year), Apr (Q1), Jul (Q2), Oct (Q3)
    const quarterlyMonths: Record<number, { quarter: number; year: number }> = {
      1: { quarter: 4, year: currentYear - 1 },
      4: { quarter: 1, year: currentYear },
      7: { quarter: 2, year: currentYear },
      10: { quarter: 3, year: currentYear }
    };

    const results: Array<{ schedule_id: number; status: string; details: string }> = [];

    for (const schedule of schedules) {
      const { id, frequency, recipient_email } = schedule;
      console.log(`📋 Processing schedule #${id}: ${frequency} -> ${recipient_email}`);

      // Determine the period to report on
      let params = '';

      if (frequency === 'monthly') {
        // Report on previous month
        const reportMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const reportYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        params = `&month=${reportMonth}&year=${reportYear}`;
        console.log(`📅 Monthly report for ${reportMonth}/${reportYear}`);

      } else if (frequency === 'quarterly') {
        // Only send in Jan, Apr, Jul, Oct
        if (!quarterlyMonths[currentMonth]) {
          console.log(`⏭️ Skipping quarterly schedule #${id} — not a quarterly month (${currentMonth})`);
          results.push({
            schedule_id: id,
            status: 'skipped',
            details: `Not a quarterly month (${currentMonth})`
          });
          continue;
        }
        const { quarter, year } = quarterlyMonths[currentMonth];
        params = `&quarter=${quarter}&year=${year}`;
        console.log(`📅 Quarterly report for Q${quarter}/${year}`);

      } else {
        console.log(`⚠️ Unknown frequency: ${frequency}`);
        results.push({
          schedule_id: id,
          status: 'error',
          details: `Unknown frequency: ${frequency}`
        });
        continue;
      }

      // Call hsb-form-v2 to generate and send the report
      try {
        const emailParam = `&recipientEmail=${encodeURIComponent(recipient_email)}`;
        const reportUrl = `${supabaseUrl}/functions/v1/hsb-form-v2?format=pdf&sendEmail=true${emailParam}${params}&reporterName=${encodeURIComponent('Automatisk rapport')}`;

        console.log(`📧 Calling hsb-form-v2: ${reportUrl}`);
        const response = await fetch(reportUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseServiceRoleKey}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ hsb-form-v2 failed for schedule #${id}:`, errorText);
          results.push({
            schedule_id: id,
            status: 'error',
            details: `hsb-form-v2 returned ${response.status}: ${errorText.substring(0, 200)}`
          });
        } else {
          const result = await response.json();
          console.log(`✅ Report sent for schedule #${id}:`, result);
          results.push({
            schedule_id: id,
            status: 'success',
            details: `Sent to ${recipient_email}`
          });
        }
      } catch (fetchError) {
        console.error(`❌ Fetch error for schedule #${id}:`, fetchError);
        results.push({
          schedule_id: id,
          status: 'error',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
        });
      }

      // Log the result
      try {
        const lastResult = results[results.length - 1];
        await supabase.from('hsb_report_log').insert({
          schedule_id: id,
          frequency,
          recipient_email,
          status: lastResult.status,
          details: lastResult.details
        });
      } catch (logError) {
        console.error(`⚠️ Failed to log result for schedule #${id}:`, logError);
      }
    }

    console.log('🏁 HSB Cron job completed:', results);

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ HSB Cron job error:', error);

    return new Response(JSON.stringify({
      error: 'Cron job failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
