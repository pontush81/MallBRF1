-- Migrate users
INSERT INTO users (id, email, role, created_at, updated_at)
SELECT id, email, role, created_at, updated_at
FROM users
ON CONFLICT (id) DO NOTHING;

-- Migrate pages
INSERT INTO pages (id, title, slug, content, is_visible, created_at, updated_at, created_by, updated_by, files)
SELECT id, title, slug, content, is_visible, created_at, updated_at, created_by, updated_by, files
FROM pages
ON CONFLICT (id) DO NOTHING; 