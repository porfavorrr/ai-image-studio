import { HeroSection } from "@/components/home/HeroSection";
import { TaskCards } from "@/components/home/TaskCards";
import { TemplatePreview } from "@/components/home/TemplatePreview";
import { PageShell } from "@/components/layout/PageShell";

export default function HomePage() {
  return (
    <PageShell>
      <HeroSection />
      <TaskCards />
      <TemplatePreview />
    </PageShell>
  );
}
