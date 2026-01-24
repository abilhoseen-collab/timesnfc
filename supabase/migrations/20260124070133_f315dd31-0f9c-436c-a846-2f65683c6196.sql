-- Add chat and payment fields to vcards table
ALTER TABLE public.vcards
ADD COLUMN IF NOT EXISTS whatsapp_number text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS telegram_username text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS chat_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_bkash text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_nagad text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_rocket text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_bank_details text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_button_text text DEFAULT 'Send Payment';

-- Add comments
COMMENT ON COLUMN public.vcards.whatsapp_number IS 'WhatsApp number for live chat widget';
COMMENT ON COLUMN public.vcards.telegram_username IS 'Telegram username for live chat';
COMMENT ON COLUMN public.vcards.payment_enabled IS 'Enable payment/donation button on vcard';