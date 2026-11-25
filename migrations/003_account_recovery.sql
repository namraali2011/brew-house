BEGIN;

ALTER TABLE accounts
    ADD COLUMN verified_email TEXT CHECK (verified_email = lower(verified_email)),
    ADD COLUMN auth_version INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX accounts_verified_email_key ON accounts (verified_email)
WHERE verified_email IS NOT NULL;

ALTER TABLE sessions ADD COLUMN auth_version INTEGER NOT NULL DEFAULT 0;

CREATE TABLE account_email_tokens (
    token_hash TEXT PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL CHECK (purpose IN ('verify', 'reset')),
    email TEXT NOT NULL,
    auth_version INTEGER NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE (account_id, purpose)
);

CREATE TABLE email_request_limits (
    scope TEXT NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL CHECK (attempts > 0),
    PRIMARY KEY (scope, window_start)
);
CREATE INDEX email_request_limits_window_idx ON email_request_limits(window_start);

COMMIT;
