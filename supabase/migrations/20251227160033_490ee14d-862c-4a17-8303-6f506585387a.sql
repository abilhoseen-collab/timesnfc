-- Add length constraints on orders table for server-side validation
ALTER TABLE public.orders 
ADD CONSTRAINT check_shipping_name_length CHECK (char_length(shipping_name) <= 255),
ADD CONSTRAINT check_shipping_address_length CHECK (char_length(shipping_address) <= 500),
ADD CONSTRAINT check_shipping_city_length CHECK (char_length(shipping_city) <= 100),
ADD CONSTRAINT check_shipping_phone_length CHECK (char_length(shipping_phone) <= 20);

-- Add length constraints on nfc_guest_orders table for server-side validation
ALTER TABLE public.nfc_guest_orders
ADD CONSTRAINT check_full_name_length CHECK (char_length(full_name) <= 255),
ADD CONSTRAINT check_guest_email_length CHECK (char_length(email) <= 255),
ADD CONSTRAINT check_guest_shipping_address_length CHECK (char_length(shipping_address) <= 500),
ADD CONSTRAINT check_guest_shipping_city_length CHECK (char_length(shipping_city) <= 100),
ADD CONSTRAINT check_guest_phone_length CHECK (char_length(phone) <= 20),
ADD CONSTRAINT check_transaction_id_length CHECK (char_length(transaction_id) <= 50);