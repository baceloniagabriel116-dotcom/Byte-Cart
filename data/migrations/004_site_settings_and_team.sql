-- Site settings (key/value, e.g. footer copyright brand name) and team members.
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT NOW()::text
);

CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  image_url TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT NOW()::text
);

-- Public read/write policies so the prototype works end-to-end
-- (RLS is disabled on the other tables; see 003_disable_rls.sql).
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "public write site_settings" ON site_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public read team_members" ON team_members FOR SELECT USING (true);
CREATE POLICY "public write team_members" ON team_members FOR ALL USING (true) WITH CHECK (true);

INSERT INTO site_settings (key, value) VALUES
  ('brand_name', 'ByteCart'),
  ('copyright_text', '© 2026 ByteCart. All rights reserved.'),
  ('social_links', '[{"label":"Facebook","url":"https://facebook.com"},{"label":"X","url":"https://x.com"},{"label":"Instagram","url":"https://instagram.com"}]')
ON CONFLICT (key) DO NOTHING;

INSERT INTO team_members (id, name, role, bio, image_url, sort_order) VALUES
  (1, 'Demo User', 'Founder & CEO', 'Passionate about making technology accessible to everyone.', '', 1)
ON CONFLICT (id) DO NOTHING;
