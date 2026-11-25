BEGIN;

ALTER TABLE accounts
    ADD COLUMN recovery_question TEXT CHECK (recovery_question IN ('dob', 'mobile', 'house', 'pin')),
    ADD COLUMN recovery_answer_hash TEXT,
    ADD CONSTRAINT accounts_recovery_pair_check
        CHECK ((recovery_question IS NULL) = (recovery_answer_hash IS NULL));

ALTER TABLE email_request_limits RENAME TO recovery_request_limits;

COMMIT;
