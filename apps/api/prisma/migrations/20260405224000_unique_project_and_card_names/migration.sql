CREATE UNIQUE INDEX "projects_name_unique"
ON "projects"("name");

CREATE UNIQUE INDEX "cards_project_title_unique"
ON "cards"("project_id", "title");
