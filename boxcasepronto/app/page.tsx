import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/sections/Hero";
import { MethodSection } from "@/components/sections/MethodSection";
import { ModalitiesSection } from "@/components/sections/ModalitiesSection";
import { PlansSection } from "@/components/sections/PlansSection";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <MethodSection />
      <ModalitiesSection />
      <PlansSection />
      <Footer />
    </main>
  );
}
