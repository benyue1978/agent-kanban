ALTER TABLE "cards"
ADD COLUMN "source_task_id" TEXT,
ADD COLUMN "source_task_fingerprint" TEXT,
ADD COLUMN "source_plan_path" TEXT,
ADD COLUMN "source_spec_path" TEXT;

CREATE UNIQUE INDEX "cards_project_source_task_unique"
ON "cards"("project_id", "source_task_id");
