-- Allow all supported vCard custom section types
ALTER TABLE public.vcard_custom_sections
  DROP CONSTRAINT IF EXISTS vcard_custom_sections_section_type_check;

ALTER TABLE public.vcard_custom_sections
  ADD CONSTRAINT vcard_custom_sections_section_type_check
  CHECK (
    section_type = ANY (
      ARRAY[
        'text'::text,
        'image_gallery'::text,
        'service_card'::text,
        'video'::text,
        'testimonial'::text,
        'product_catalog'::text,
        'product_gallery'::text,
        'social_proof'::text,
        'faq'::text,
        'contact_form'::text
      ]
    )
  );