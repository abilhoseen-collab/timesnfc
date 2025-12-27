import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  fullName: string;
  packageName: string;
  amount: number;
  expiresAt?: string;
  subscriptionId: string;
}

const DEFAULT_PASSWORD = "112233";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      fullName, 
      packageName, 
      amount, 
      expiresAt,
      subscriptionId 
    }: CreateUserRequest = await req.json();

    console.log(`Creating user account for ${email}`);

    // Create Supabase admin client
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email.toLowerCase());

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      console.log(`User already exists with ID: ${existingUser.id}`);
      userId = existingUser.id;
      
      // Update the subscription with the existing user ID
      await supabaseAdmin
        .from('subscriptions')
        .update({ user_id: userId })
        .eq('id', subscriptionId);
    } else {
      // Create new user with default password
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      userId = newUser.user.id;
      isNewUser = true;
      console.log(`Created new user with ID: ${userId}`);

      // Update subscription with new user ID
      await supabaseAdmin
        .from('subscriptions')
        .update({ user_id: userId })
        .eq('id', subscriptionId);
    }

    // Send email with login credentials
    const loginUrl = `https://minylqvqwrawlzrjgazm.lovableproject.com/auth`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10b981; margin: 0;">🎉 Payment Approved!</h1>
          <p style="color: #666; font-size: 18px;">Your ${packageName} plan is now active</p>
        </div>
        
        <p style="font-size: 16px; color: #333;">Dear ${fullName || 'Valued Customer'},</p>
        <p style="font-size: 16px; color: #333;">Great news! Your payment has been verified and your account is ready.</p>
        
        <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 25px; border-radius: 15px; margin: 25px 0; color: white;">
          <h3 style="margin-top: 0; font-size: 18px;">📦 Package Details</h3>
          <p style="margin: 8px 0;"><strong>Plan:</strong> ${packageName}</p>
          <p style="margin: 8px 0;"><strong>Amount Paid:</strong> ৳${amount}</p>
          ${expiresAt ? `<p style="margin: 8px 0;"><strong>Valid Until:</strong> ${new Date(expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
        </div>
        
        <div style="background: #f3f4f6; border: 2px solid #e5e7eb; padding: 25px; border-radius: 15px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #374151;">🔐 Your Login Credentials</h3>
          <div style="background: white; padding: 15px; border-radius: 10px; margin: 15px 0;">
            <p style="margin: 8px 0; color: #333;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 8px 0; color: #333;"><strong>Password:</strong> ${DEFAULT_PASSWORD}</p>
          </div>
          <p style="color: #ef4444; font-size: 14px; margin-bottom: 0;">
            ⚠️ Please change your password after first login for security!
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: white; padding: 15px 40px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Login to Your Dashboard →
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px;">If you have any questions, please contact our support team.</p>
        <p style="color: #666; font-size: 14px;">Thank you for choosing us!</p>
        <p style="color: #666; font-size: 14px;">Best regards,<br><strong>Times Digital Team</strong></p>
      </div>
    `;

    // Send email
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Times Digital <onboarding@resend.dev>",
        to: [email],
        subject: `🎉 ${packageName} Plan Activated - Your Login Credentials`,
        html: emailHtml,
      }),
    });

    const emailResponse = await emailRes.json();
    console.log("Email sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId, 
        isNewUser,
        message: isNewUser ? 'User created and email sent' : 'Existing user linked and email sent'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in create-user-account function:", error);
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