-- Phase 2 / 003 — Module 18: multi-factor authentication (TOTP).
-- mfa_secret is stored while enrolment is pending; mfa_enabled flips once the
-- user has proven possession of the authenticator (first valid code).

ALTER TABLE users
    ADD COLUMN mfa_secret  VARCHAR(64),
    ADD COLUMN mfa_enabled BOOLEAN NOT NULL DEFAULT false;
