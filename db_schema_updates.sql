ALTER TYPE programme_currentstage_enum RENAME TO programme_currentstage_enum_old;

CREATE TYPE programme_currentstage_enum AS ENUM('AwaitingAuthorization', 'Issued', 'Rejected');

ALTER TABLE programme ALTER COLUMN "currentStage" SET DEFAULT('AwaitingAuthorization');

ALTER TABLE "programme" ALTER COLUMN "currentStage" TYPE "programme_currentstage_enum" USING "currentStage"::"text"::programme_currentstage_enum;

DROP TYPE programme_currentstage_enum_old;