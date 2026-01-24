import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AppointmentNotificationRequest {
  vcard_id: string;
  appointment_id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone?: string;
  appointment_date: string;
  appointment_time: string;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      vcard_id,
      appointment_id,
      visitor_name,
      visitor_email,
      visitor_phone,
      appointment_date,
      appointment_time,
      notes,
    }: AppointmentNotificationRequest = await req.json();

    // Input validation
    if (!vcard_id || !appointment_id || !visitor_name || !visitor_email || !appointment_date || !appointment_time) {
      console.log("Missing required fields");
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Processing appointment notification for vcard: ${vcard_id}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch vcard details
    const { data: vcard, error: vcardError } = await supabase
      .from("vcards")
      .select("name, email, appointment_email, appointment_title")
      .eq("id", vcard_id)
      .single();

    if (vcardError || !vcard) {
      console.error("VCard not found:", vcardError);
      return new Response(JSON.stringify({ error: "VCard not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const ownerEmail = vcard.appointment_email || vcard.email;
    if (!ownerEmail) {
      console.log("No email configured for notifications");
      return new Response(JSON.stringify({ message: "No email configured" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Format date for display
    const formattedDate = new Date(appointment_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Send email to business owner
    const ownerEmailResponse = await resend.emails.send({
      from: "Appointments <onboarding@resend.dev>",
      to: [ownerEmail],
      subject: `📅 New Appointment: ${visitor_name} - ${formattedDate}`,
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
              <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                  📅 New Appointment Booked!
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Great news! Someone has booked an appointment with you.
                </p>
                
                <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #111827; font-size: 16px; margin: 0 0 15px 0;">📋 Appointment Details</h3>
                  
                  <table style="width: 100%;">
                    <tr>
                      <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">Client Name:</td>
                      <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 5px 0;">${visitor_name}</td>
                    </tr>
                    <tr>
                      <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">Email:</td>
                      <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 5px 0;">${visitor_email}</td>
                    </tr>
                    ${visitor_phone ? `
                    <tr>
                      <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">Phone:</td>
                      <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 5px 0;">${visitor_phone}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">Date:</td>
                      <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 5px 0;">${formattedDate}</td>
                    </tr>
                    <tr>
                      <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">Time:</td>
                      <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 5px 0;">${appointment_time}</td>
                    </tr>
                  </table>
                  
                  ${notes ? `
                  <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0;">Notes:</p>
                    <p style="color: #111827; font-size: 14px; margin: 0;">${notes}</p>
                  </div>
                  ` : ''}
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                  Please confirm this appointment with your client.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  ${vcard.appointment_title || 'Appointment Booking'} - ${vcard.name}
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Owner email sent:", ownerEmailResponse);

    // Send confirmation email to visitor
    const visitorEmailResponse = await resend.emails.send({
      from: "Appointments <onboarding@resend.dev>",
      to: [visitor_email],
      subject: `✅ Appointment Confirmed with ${vcard.name}`,
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
              <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                  ✅ Appointment Confirmed!
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Hi ${visitor_name},<br><br>
                  Your appointment with <strong>${vcard.name}</strong> has been successfully booked!
                </p>
                
                <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #065f46; font-size: 16px; margin: 0 0 15px 0;">📅 Your Appointment</h3>
                  
                  <p style="color: #047857; font-size: 18px; font-weight: 600; margin: 0;">
                    ${formattedDate} at ${appointment_time}
                  </p>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                  We look forward to seeing you! If you need to reschedule or cancel, please contact us directly.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  Booked via ${vcard.name}'s Digital Business Card
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Visitor confirmation email sent:", visitorEmailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-appointment-notification function:", error);
    return new Response(JSON.stringify({ error: "An error occurred processing your request" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
