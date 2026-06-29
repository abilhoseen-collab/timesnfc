import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactNotificationRequest {
  vcard_id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone?: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      vcard_id,
      visitor_name,
      visitor_email,
      visitor_phone,
      message,
    }: ContactNotificationRequest = await req.json();

    // Input validation
    if (!vcard_id || !visitor_name || !visitor_email || !message) {
      console.log("Missing required fields");
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Processing contact notification for vcard: ${vcard_id}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch vcard details
    const { data: vcard, error: vcardError } = await supabase
      .from("vcards")
      .select("name, email, notification_email")
      .eq("id", vcard_id)
      .single();

    if (vcardError || !vcard) {
      console.error("VCard not found:", vcardError);
      return new Response(JSON.stringify({ error: "VCard not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const ownerEmail = vcard.notification_email || vcard.email;
    if (!ownerEmail) {
      console.log("No email configured for notifications");
      return new Response(JSON.stringify({ message: "No email configured" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Sanitize message content
    const sanitizedMessage = message
      .replace(/[<>]/g, '')
      .substring(0, 2000);

    // Send email to business owner
    const emailResponse = await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: [ownerEmail],
      reply_to: visitor_email,
      subject: `💬 New Message from ${visitor_name}`,
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
              <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                  💬 New Contact Message
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  You have received a new message from your digital business card!
                </p>
                
                <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #111827; font-size: 16px; margin: 0 0 15px 0;">📋 Contact Details</h3>
                  
                  <table style="width: 100%;">
                    <tr>
                      <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">Name:</td>
                      <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 5px 0;">${visitor_name}</td>
                    </tr>
                    <tr>
                      <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">Email:</td>
                      <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 5px 0;">
                        <a href="mailto:${visitor_email}" style="color: #3b82f6;">${visitor_email}</a>
                      </td>
                    </tr>
                    ${visitor_phone ? `
                    <tr>
                      <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">Phone:</td>
                      <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 5px 0;">
                        <a href="tel:${visitor_phone}" style="color: #3b82f6;">${visitor_phone}</a>
                      </td>
                    </tr>
                    ` : ''}
                  </table>
                </div>
                
                <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">📝 Message</h3>
                  <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${sanitizedMessage}</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="mailto:${visitor_email}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
                    Reply to ${visitor_name}
                  </a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  Contact Form - ${vcard.name}'s Digital Business Card
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Contact notification email sent:", emailResponse);

    // Fire web push (best-effort)
    try {
      const { data: owner } = await supabase
        .from("vcards")
        .select("user_id")
        .eq("id", vcard_id)
        .maybeSingle();
      if (owner?.user_id) {
        await supabase.functions.invoke("send-web-push", {
          body: {
            user_id: owner.user_id,
            title: "📥 নতুন Lead",
            body: `${visitor_name} আপনার কার্ডে যোগাযোগ করেছেন`,
            url: "/leads",
            tag: "new-lead",
          },
        });
      }
    } catch (pushErr) {
      console.error("push dispatch failed", pushErr);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-contact-notification function:", error);
    return new Response(JSON.stringify({ error: "An error occurred processing your request" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
