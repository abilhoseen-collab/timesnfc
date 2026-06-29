import { UAParser } from "ua-parser-js";
import { supabase } from "@/integrations/supabase/client";

export async function logLoginActivity(
  userId: string,
  eventType: "login" | "logout" | "failed_login" | "password_change" = "login",
  success: boolean = true
) {
  try {
    const parser = new UAParser(navigator.userAgent);
    const result = parser.getResult();

    // Best-effort IP/geo via free service (non-blocking failure)
    let ip_address: string | undefined;
    let country: string | undefined;
    let city: string | undefined;
    try {
      const r = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(2500) });
      if (r.ok) {
        const j = await r.json();
        ip_address = j.ip;
        country = j.country_name;
        city = j.city;
      }
    } catch {
      /* ignore */
    }

    await supabase.from("login_activity").insert({
      user_id: userId,
      ip_address,
      user_agent: navigator.userAgent,
      device: result.device.type || "desktop",
      browser: `${result.browser.name || ""} ${result.browser.version || ""}`.trim(),
      os: `${result.os.name || ""} ${result.os.version || ""}`.trim(),
      country,
      city,
      success,
      event_type: eventType,
    });
  } catch (e) {
    console.warn("[loginActivity] log failed", e);
  }
}
