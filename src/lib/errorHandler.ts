/**
 * Maps database and API errors to user-friendly Bengali messages.
 * Prevents leaking internal implementation details to users.
 */
export const getUserFriendlyError = (error: any): string => {
  // Log full error for debugging (dev only noise; safe in prod)
  if (typeof console !== 'undefined') {
    console.error('[Error Details]:', error);
  }

  if (!error) return 'একটি অজানা ত্রুটি ঘটেছে। আবার চেষ্টা করুন।';

  const code = error?.code;
  const msg: string = (error?.message || error?.error_description || '').toString();

  // Postgres error codes
  if (code === '23505') return 'এই তথ্য ইতিমধ্যে বিদ্যমান। অন্য মান ব্যবহার করুন।';
  if (code === '23503') return 'অবৈধ রেফারেন্স। ইনপুট পরীক্ষা করুন।';
  if (code === '23502') return 'প্রয়োজনীয় ফিল্ড খালি। সব ফিল্ড পূরণ করুন।';
  if (code === '23514') return 'ইনপুট ভ্যালিডেশন ব্যর্থ। ডেটা পরীক্ষা করুন।';
  if (code === '42501') return 'এই কাজ করার অনুমতি আপনার নেই।';
  if (code === '42P01') return 'একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।';
  if (code === 'PGRST116') return 'কোনো তথ্য পাওয়া যায়নি।';
  if (code === 'PGRST301') return 'সেশন এক্সপায়ার্ড। পুনরায় লগইন করুন।';

  // RLS / policy
  if (msg.includes('policy') || msg.includes('row-level security')) {
    return 'অ্যাক্সেস অস্বীকৃত। লগইন করে আবার চেষ্টা করুন।';
  }

  // Auth
  if (msg.includes('Invalid login credentials')) return 'ইমেইল বা পাসওয়ার্ড ভুল।';
  if (msg.includes('Email not confirmed')) return 'ইমেইল ভেরিফাই করুন।';
  if (msg.includes('User already registered')) return 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে।';
  if (msg.includes('Password should be')) return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
  if (msg.includes('rate limit')) return 'অনেকবার চেষ্টা করেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।';

  // Storage
  if (msg.includes('storage') || msg.includes('bucket')) {
    return 'ফাইল আপলোড ব্যর্থ। আবার চেষ্টা করুন।';
  }
  if (msg.includes('exceeded the maximum allowed size') || msg.includes('Payload too large')) {
    return 'ফাইলের সাইজ অনেক বড়। ছোট ফাইল আপলোড করুন।';
  }

  // Offline / Network
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'আপনি অফলাইন। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।';
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network') || msg.includes('ERR_INTERNET_DISCONNECTED')) {
    return 'নেটওয়ার্ক সমস্যা। ইন্টারনেট সংযোগ পরীক্ষা করুন।';
  }
  if (msg.includes('timeout') || msg.includes('Timeout') || msg.includes('AbortError')) {
    return 'অনুরোধটি টাইমআউট হয়েছে। আবার চেষ্টা করুন।';
  }
  if (msg.includes('429') || msg.includes('Too Many Requests')) {
    return 'অনেকবার চেষ্টা করেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।';
  }
  if (msg.includes('402') || msg.includes('Payment Required')) {
    return 'এই ফিচার ব্যবহারের জন্য পেমেন্ট প্রয়োজন।';
  }
  if (msg.includes('503') || msg.includes('Service Unavailable') || msg.includes('502')) {
    return 'সার্ভার এখন ব্যস্ত। কিছুক্ষণ পর আবার চেষ্টা করুন।';
  }

  return 'একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন বা সাপোর্টে যোগাযোগ করুন।';
};

/**
 * Wraps an async operation with a friendly error message via toast.
 */
export const safeAsync = async <T,>(
  fn: () => Promise<T>,
  toast?: (opts: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void,
  fallbackTitle = 'ত্রুটি'
): Promise<T | null> => {
  try {
    return await fn();
  } catch (err) {
    const message = getUserFriendlyError(err);
    if (toast) toast({ title: fallbackTitle, description: message, variant: 'destructive' });
    return null;
  }
};
