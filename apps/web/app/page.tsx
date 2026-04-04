import { redirect } from "next/navigation";

export default function HomePage() {
  redirect(`/projects/${process.env.KANBAN_PROJECT_ID ?? "project-1"}`);
}
