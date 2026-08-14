CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT SELECT ON public.settings TO anon;
GRANT ALL ON public.settings TO service_role;

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL TO authenticated USING (true);

INSERT INTO public.settings (key, value) VALUES 
('whatsapp_number', '"923021937758"'),
('tiktok_url', '"https://www.tiktok.com/@ammar.editz8"')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;