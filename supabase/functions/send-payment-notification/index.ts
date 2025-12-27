import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PaymentNotificationRequest {
  type: 'approved' | 'rejected';
  userEmail: string;
  userName: string;
  packageName: string;
  amount: number;
  expiresAt?: string;
  adminNotes?: string;
  isNfcOrder?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      type, 
      userEmail, 
      userName, 
      packageName, 
      amount, 
      expiresAt,
      adminNotes,
      isNfcOrder
    }: PaymentNotificationRequest = await req.json();

    console.log(`Sending ${type} notification to ${userEmail} (NFC: ${isNfcOrder || false})`);

    let subject: string;
    let htmlContent: string;

    if (isNfcOrder) {
      // NFC Order notifications
      if (type === 'approved') {
        subject = `🎉 NFC Card Order Approved - Ready to Register!`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #10b981; margin: 0;">Order Approved! 🎉</h1>
            </div>
            
            <p style="font-size: 16px; color: #333;">Dear ${userName || 'Valued Customer'},</p>
            <p style="font-size: 16px; color: #333;">Great news! Your NFC card payment has been verified and approved.</p>
            
            <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 25px; border-radius: 15px; margin: 25px 0; color: white;">
              <h3 style="margin-top: 0; font-size: 18px;">Order Details</h3>
              <p style="margin: 8px 0;"><strong>Product:</strong> ${packageName}</p>
              <p style="margin: 8px 0;"><strong>Amount:</strong> ৳${amount}</p>
              <p style="margin: 8px 0;"><strong>Status:</strong> ✓ Approved</p>
            </div>
            
            <div style="background: #ecfdf5; border: 2px solid #10b981; padding: 20px; border-radius: 10px; margin: 25px 0;">
              <h3 style="color: #047857; margin-top: 0;">🚀 Next Step: Create Your Account</h3>
              <p style="color: #065f46; margin-bottom: 15px;">
                You can now register on our platform using this email address to manage your digital business card.
              </p>
              <a href="https://minylqvqwrawlzrjgazm.lovableproject.com/auth?email=${encodeURIComponent(userEmail)}" 
                 style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Register Now →
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">Your NFC card will be shipped to your provided address within 2-3 business days.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 14px;">Thank you for choosing us!</p>
            <p style="color: #666; font-size: 14px;">Best regards,<br><strong>Times Digital Team</strong></p>
          </div>
        `;
      } else {
        subject = `NFC Card Order Update - Action Required`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #ef4444;">Order Could Not Be Processed</h1>
            <p style="font-size: 16px; color: #333;">Dear ${userName || 'Valued Customer'},</p>
            <p style="font-size: 16px; color: #333;">We were unable to verify your payment for <strong>${packageName}</strong> (৳${amount}).</p>
            
            ${adminNotes ? `
            <div style="background: #fef2f2; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <h3 style="margin-top: 0; color: #ef4444;">Reason</h3>
              <p style="color: #7f1d1d;">${adminNotes}</p>
            </div>
            ` : ''}
            
            <p style="color: #333;">Please try placing a new order with the correct payment details, or contact our support team for assistance.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 14px;">Best regards,<br><strong>Times Digital Team</strong></p>
          </div>
        `;
      }
    } else {
      // Subscription notifications (existing logic)
      if (type === 'approved') {
        subject = `🎉 Payment Approved - ${packageName} Plan Activated!`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981;">Payment Approved! 🎉</h1>
            <p>Dear ${userName || 'Valued Customer'},</p>
            <p>Great news! Your payment has been verified and approved.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Subscription Details</h3>
              <p><strong>Plan:</strong> ${packageName}</p>
              <p><strong>Amount:</strong> ৳${amount}</p>
              ${expiresAt ? `<p><strong>Valid Until:</strong> ${new Date(expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
            </div>
            
            <p>You now have access to all premium features. Start creating amazing digital business cards today!</p>
            
            <p>Thank you for choosing us!</p>
            <p>Best regards,<br>The Team</p>
          </div>
        `;
      } else {
        subject = `Payment Status Update - Action Required`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444;">Payment Could Not Be Verified</h1>
            <p>Dear ${userName || 'Valued Customer'},</p>
            <p>We were unable to verify your payment for the ${packageName} plan (৳${amount}).</p>
            
            ${adminNotes ? `
            <div style="background: #fef2f2; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <h3 style="margin-top: 0; color: #ef4444;">Reason</h3>
              <p>${adminNotes}</p>
            </div>
            ` : ''}
            
            <p>Please try submitting your payment again with the correct transaction details, or contact our support team for assistance.</p>
            
            <p>If you believe this is an error, please reach out to us with your transaction proof.</p>
            
            <p>Best regards,<br>The Team</p>
          </div>
        `;
      }
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Times Digital <onboarding@resend.dev>",
        to: [userEmail],
        subject: subject,
        html: htmlContent,
      }),
    });

    const emailResponse = await res.json();

    console.log("Payment notification sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-payment-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
