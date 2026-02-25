CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  github_user_id BIGINT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  access_token TEXT NOT NULL, -- encrypted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE repos (
  id SERIAL PRIMARY KEY,
  github_repo_id BIGINT UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- DB user id
  name TEXT NOT NULL, -- repo name
  owner TEXT NOT NULL, -- repo owner
  is_private BOOLEAN NOT NULL,
  main_language TEXT,
  is_tracked BOOLEAN DEFAULT FALSE,
  github_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scans (
  id SERIAL PRIMARY KEY,
  repo_id INTEGER REFERENCES repos(id) ON DELETE CASCADE,
  branch TEXT NOT NULL,
  commit_hash TEXT NOT NULL,
  status TEXT CHECK (status IN ('SAFE','WARNING','CRITICAL')) NOT NULL,
  pii_count INTEGER DEFAULT 0,
  key_count INTEGER DEFAULT 0,
  scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE findings (
  id SERIAL PRIMARY KEY,
  scan_id INTEGER REFERENCES scans(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('PII','KEY')) NOT NULL,
  file TEXT NOT NULL,
  line INTEGER NOT NULL,
  severity TEXT CHECK (severity IN ('WARNING','CRITICAL')) NOT NULL,
  description TEXT,
  snippet TEXT
);

CREATE TABLE user_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  auto_scan BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ignore_rules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL
);

CREATE TABLE custom_rules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  regex TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('WARNING','CRITICAL')) NOT NULL
);