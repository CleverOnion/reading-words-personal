CREATE TABLE ai_settings (
 user_id text PRIMARY KEY NOT NULL,
 base_url text NOT NULL,
 model text NOT NULL,
 encrypted_key text NOT NULL,
 updated_at integer NOT NULL
);
CREATE TABLE ai_notes (
 user_id text NOT NULL,
 word_key text NOT NULL,
 word_id text NOT NULL,
 status text NOT NULL DEFAULT 'pending',
 content text,
 model text,
 error text,
 updated_at integer NOT NULL,
 lease_until integer NOT NULL DEFAULT 0,
 lease_token text,
 PRIMARY KEY (user_id, word_key)
);
CREATE INDEX idx_ai_notes_queue ON ai_notes(user_id,status,lease_until);
CREATE TABLE ai_jobs (
 user_id text PRIMARY KEY NOT NULL,
 status text NOT NULL DEFAULT 'paused',
 lease_until integer NOT NULL DEFAULT 0,
 lease_token text,
 last_error text,
 updated_at integer NOT NULL
);
