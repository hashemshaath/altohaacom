import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);

    // Find events starting tomorrow (24h reminder)
    const { data: upcomingEvents, error } = await supabase
      .from('chef_schedule_events')
      .select('id, chef_id, title, title_ar, start_date, end_date, event_type, city, venue, status')
      .neq('status', 'cancelled')
      .gte('start_date', tomorrow.toISOString())
      .lt('start_date', dayAfter.toISOString());

    if (error) throw error;

    let notificationCount = 0;

    for (const event of (upcomingEvents || [])) {
      const startDate = new Date(event.start_date);
      const formattedDate = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const locationInfo = event.city ? ` in ${event.city}` : '';

      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: event.chef_id,
          title: `Reminder: ${event.title} tomorrow`,
          title_ar: `تذكير: ${event.title_ar || event.title} غداً`,
          body: `Your ${event.event_type} "${event.title}" is scheduled for ${formattedDate}${locationInfo}.`,
          body_ar: `${event.title_ar || event.title} مقرر في ${formattedDate}${event.city ? ` في ${event.city}` : ''}.`,
          type: 'schedule_reminder',
          link: '/profile?tab=schedule',
          metadata: {
            event_id: event.id,
            event_type: event.event_type,
            reminder_type: '24h',
          },
        });

      if (!notifError) notificationCount++;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        reminders_sent: notificationCount,
        events_found: upcomingEvents?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
