// VCard Editor Form Data Types

export interface FormData {
  name: string;
  job_title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  bio: string;
  template: string;
  linkedin_url: string;
  twitter_url: string;
  facebook_url: string;
  instagram_url: string;
  youtube_url: string;
  github_url: string;
  is_active: boolean;
  photo_url: string;
  cover_image_url: string;
  qr_foreground_color: string;
  qr_background_color: string;
  qr_logo_url: string;
  notification_email: string;
  notify_on_view: boolean;
  notify_on_click: boolean;
  slug: string;
  // Chat & Payment fields
  whatsapp_number: string;
  telegram_username: string;
  chat_enabled: boolean;
  payment_enabled: boolean;
  payment_bkash: string;
  payment_nagad: string;
  payment_rocket: string;
  payment_bank_details: string;
  payment_button_text: string;
  // Appointment fields
  appointment_enabled: boolean;
  appointment_title: string;
  appointment_description: string;
  appointment_duration_minutes: number;
  appointment_available_days: string[];
  appointment_start_time: string;
  appointment_end_time: string;
  appointment_email: string;
  // Branding
  hide_branding?: boolean;
}

export const initialFormData: FormData = {
  name: '',
  job_title: '',
  company: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  bio: '',
  template: 'freelancer',
  linkedin_url: '',
  twitter_url: '',
  facebook_url: '',
  instagram_url: '',
  youtube_url: '',
  github_url: '',
  is_active: true,
  photo_url: '',
  cover_image_url: '',
  qr_foreground_color: '#000000',
  qr_background_color: '#FFFFFF',
  qr_logo_url: '',
  notification_email: '',
  notify_on_view: false,
  notify_on_click: false,
  slug: '',
  // Chat & Payment
  whatsapp_number: '',
  telegram_username: '',
  chat_enabled: false,
  payment_enabled: false,
  payment_bkash: '',
  payment_nagad: '',
  payment_rocket: '',
  payment_bank_details: '',
  payment_button_text: 'Send Payment / Donate',
  // Appointment
  appointment_enabled: false,
  appointment_title: 'Book an Appointment',
  appointment_description: '',
  appointment_duration_minutes: 30,
  appointment_available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  appointment_start_time: '09:00',
  appointment_end_time: '17:00',
  appointment_email: '',
  hide_branding: false,
};

export interface Template {
  id: string;
  name: string;
  image: string;
}
