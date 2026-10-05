import { ScreenShield } from "@/components/protection";

// Pages portfolio : flou de protection des médias (réglable dans l'admin),
// blocs animés au chargement et au scroll (reveal-page, voir ScrollReveal).
export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="reveal-page">{children}</div>
      <ScreenShield />
    </>
  );
}
