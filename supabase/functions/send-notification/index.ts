import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  vcard_id: string;
  event_type: "view" | "link_click";
  link_name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vcard_id, event_type, link_name }: NotificationRequest = await req.json();

    console.log(`Processing notification for vcard: ${vcard_id}, event: ${event_type}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch vcard details
    const { data: vcard, error: vcardError } = await supabase
      .from("vcards")
      .select("name, notification_email, notify_on_view, notify_on_click")
      .eq("id", vcard_id)
      .single();

    if (vcardError || !vcard) {
      console.error("VCard not found:", vcardError);
      return new Response(JSON.stringify({ error: "VCard not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if notifications are enabled
    const shouldNotify =
      (event_type === "view" && vcard.notify_on_view) ||
      (event_type === "link_click" && vcard.notify_on_click);

    if (!shouldNotify || !vcard.notification_email) {
      console.log("Notifications not enabled or no email configured");
      return new Response(JSON.stringify({ message: "Notification not required" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Send email notification
    const subject =
      event_type === "view"
        ? `🎉 Someone viewed your business card: ${vcard.name}`
        : `👆 Someone clicked a link on your card: ${vcard.name}`;

    const eventDescription =
      event_type === "view"
        ? "Your digital business card was just viewed!"
        : `Someone clicked the "${link_name || "a link"}" on your digital business card!`;

    const emailResponse = await resend.emails.send({
      from: "Notifications <onboarding@resend.dev>",
      to: [vcard.notification_email],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 20px; margin-bottom: 20px;">
            <tr>
              <td style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                  ${event_type === "view" ? "👀 New Card View!" : "🔗 Link Clicked!"}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  ${eventDescription}
                </p>
                <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0;">Card Name</p>
                  <p style="color: #111827; font-size: 18px; font-weight: 600; margin: 0;">${vcard.name}</p>
                </div>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                  Time: ${new Date().toLocaleString()}
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  Digital Business Card Notifications
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);