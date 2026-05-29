import { createFileRoute } from "@tanstack/react-router";
import { NovidsadesPage } from "@/components/NovidsadesPage";

export const Route = createFileRoute("/novidades")({
  component: NovidsadesPage,
});
