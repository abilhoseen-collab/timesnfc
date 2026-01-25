import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface SubscriptionWithUser {
  id: string;
  user_id: string;
  expires_at: string;
  package_id: string;
  profiles: {
    email: string;
    full_name: string;
  } | null;
  packages: {
    name: string;
  } | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the date 7 days from now
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sixDaysFromNow = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);

    // Format dates for query
    const startDate = sixDaysFromNow.toISOString();
    const endDate = sevenDaysFromNow.toISOString();

    console.log(`Checking for subscriptions expiring between ${startDate} and ${endDate}`);

    // Find subscriptions expiring in exactly 7 days
    const { data: expiringSubscriptions, error: fetchError } = await supabase
      .from("subscriptions")
      .select(`
        id,
        user_id,
        expires_at,
        package_id,
        profiles!subscriptions_user_id_fkey(email, full_name),
        packages(name)
      `)
      .eq("status", "approved")
      .gte("expires_at", startDate)
      .lte("expires_at", endDate);

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiringSubscriptions?.length || 0} expiring subscriptions`);

    if (!expiringSubscriptions || expiringSubscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions expiring in 7 days", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailResults = [];

    for (const subscription of expiringSubscriptions as unknown as SubscriptionWithUser[]) {
      const userEmail = subscription.profiles?.email;
      const userName = subscription.profiles?.full_name || "User";
      const packageName = subscription.packages?.name || "Your subscription";
      const expiryDate = new Date(subscription.expires_at).toLocaleDateString("bn-BD", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!userEmail) {
        console.log(`No email found for subscription ${subscription.id}`);
        continue;
      }

      try {
        const emailResponse = await resend.emails.send({
          from: "Times Digital <noreply@timesdigital.com>",
          to: [userEmail],
          subject: `⏰ আপনার সাবস্ক্রিপশন ৭ দিনের মধ্যে শেষ হবে - Times Digital`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">⏰ সাবস্ক্রিপশন এক্সপায়ারি নোটিস</h1>
              </div>
              
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px;">প্রিয় <strong>${userName}</strong>,</p>
                
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #92400e;">
                    <strong>⚠️ গুরুত্বপূর্ণ:</strong> আপনার <strong>${packageName}</strong> প্যাকেজ <strong>${expiryDate}</strong> তারিখে শেষ হবে।
                  </p>
                </div>
                
                <p>আপনার সার্ভিস নিরবচ্ছিন্ন রাখতে অনুগ্রহ করে সময়মত রিনিউ করুন।</p>
                
                <h3 style="color: #14b8a6; margin-top: 25px;">রিনিউ করলে আপনি পাবেন:</h3>
                <ul style="padding-left: 20px;">
                  <li>✅ আনলিমিটেড VCard তৈরি</li>
                  <li>✅ প্রিমিয়াম টেমপ্লেট এক্সেস</li>
                  <li>✅ অ্যানালিটিক্স ড্যাশবোর্ড</li>
                  <li>✅ কাস্টম সেকশন ফিচার</li>
                  <li>✅ QR কোড কাস্টমাইজেশন</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://timesnfc.lovable.app/dashboard" 
                     style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    এখনই রিনিউ করুন
                  </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px;">
                  কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন।
                </p>
              </div>
              
              <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
                <p>© ${new Date().getFullYear()} Times Digital. সর্বস্বত্ব সংরক্ষিত।</p>
                <p>এই ইমেইলটি আপনি পেয়েছেন কারণ আপনি Times Digital এর একজন সাবস্ক্রাইবার।</p>
              </div>
            </body>
            </html>
          `,
        });

        console.log(`Email sent to ${userEmail}:`, emailResponse);
        emailResults.push({ email: userEmail, success: true });
      } catch (emailError: any) {
        console.error(`Failed to send email to ${userEmail}:`, emailError);
        emailResults.push({ email: userEmail, success: false, error: emailError.message });
      }
    }

    const successCount = emailResults.filter(r => r.success).length;
    
    return new Response(
      JSON.stringify({
        message: `Subscription expiry notifications sent`,
        total: expiringSubscriptions.length,
        sent: successCount,
        failed: emailResults.length - successCount,
        results: emailResults,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in subscription-expiry-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
