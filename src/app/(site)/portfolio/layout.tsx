import { ScreenShield } from "@/components/protection";

// Pages portfolio : flou de protection des médias (réglable dans l'admin).
export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ScreenShield />
    </>
  );
}
