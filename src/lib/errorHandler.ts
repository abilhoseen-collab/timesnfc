/**
 * Maps database and API errors to user-friendly messages.
 * Prevents leaking internal implementation details to users.
 */
export const getUserFriendlyError = (error: any): string => {
  // Log full error server-side for debugging
  console.error('[Error Details]:', error);
  
  // Map common Postgres error codes
  if (error?.code === '23505') return 'This item already exists. Please try a different value.';
  if (error?.code === '23503') return 'Invalid reference. Please check your input.';
  if (error?.code === '23502') return 'Required field is missing. Please fill all required fields.';
  if (error?.code === '23514') return 'Input validation failed. Please check your data.';
  if (error?.code === '42501') return 'You do not have permission to perform this action.';
  if (error?.code === '42P01') return 'An error occurred. Please try again.';
  if (error?.code === 'PGRST116') return 'Record not found.';
  
  // Map RLS policy violations
  if (error?.message?.includes('policy')) return 'Access denied. Please check your permissions.';
  if (error?.message?.includes('row-level security')) return 'Access denied. Please log in and try again.';
  
  // Map auth errors
  if (error?.message?.includes('Invalid login credentials')) return 'Invalid email or password.';
  if (error?.message?.includes('Email not confirmed')) return 'Please verify your email address.';
  if (error?.message?.includes('User already registered')) return 'An account with this email already exists.';
  
  // Map storage errors
  if (error?.message?.includes('storage')) return 'File upload failed. Please try again.';
  if (error?.message?.includes('bucket')) return 'File storage error. Please try again.';
  
  // Map network errors
  if (error?.message?.includes('Failed to fetch')) return 'Network error. Please check your connection.';
  if (error?.message?.includes('NetworkError')) return 'Network error. Please check your connection.';
  
  // Generic fallback - never expose the actual error message
  return 'An error occurred. Please try again or contact support if the problem persists.';
};
