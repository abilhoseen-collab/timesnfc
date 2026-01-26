-- Add VCard and Landing Page limits to packages table
ALTER TABLE public.packages 
ADD COLUMN vcard_limit integer NOT NULL DEFAULT 1,
ADD COLUMN landing_page_limit integer NOT NULL DEFAULT 1;

-- Update existing packages with limits based on pricing tiers
-- Basic (299 BDT): 1 VCard, 1 Landing Page
UPDATE public.packages SET vcard_limit = 1, landing_page_limit = 1 WHERE price = 299;

-- Pro (599 BDT): 3 VCards, 2 Landing Pages  
UPDATE public.packages SET vcard_limit = 3, landing_page_limit = 2 WHERE price = 599;

-- Business (1499 BDT): 7 VCards, 4 Landing Pages
UPDATE public.packages SET vcard_limit = 7, landing_page_limit = 4 WHERE price = 1499;