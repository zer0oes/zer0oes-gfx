import type { Locale } from "@/lib/i18n";
import { getStore } from "@/lib/store";
import { launchActive } from "@/lib/launch-offer";
import { bannerScheduled, sortBanners } from "@/lib/promotions";
import { bannerSlide } from "@/lib/announcement-carousel";
import { AnnouncementCarousel } from "./AnnouncementCarousel";

// Bandeaux sous le menu : ceux « dans le carrousel » tournent ensemble, les autres s'affichent fixes, l'un sous l'autre.
// Ceux de l'offre de lancement restent transmis tant qu'elle est activée : le carrousel suit sa date et son quota.
export async function Announcements({ locale }: { locale: Locale }) {
  const store = getStore();
  const [banners, campaign, promotions] = await Promise.all([store.listBanners(), store.getLaunchState(), store.listPromotions()]);
  const status = { active: launchActive(campaign), remaining: campaign.ordersRemaining ?? null };
  const live = sortBanners(banners).filter((b) => bannerScheduled(b, promotions, { enabled: campaign.enabled, active: status.active }));
  const fixed = live.filter((b) => b.carousel === false);
  return <>
    <AnnouncementCarousel slides={live.filter((b) => b.carousel !== false).map(bannerSlide)} locale={locale} initialStatus={status} />
    {fixed.map((b) => <AnnouncementCarousel key={b.id} slides={[bannerSlide(b)]} locale={locale} initialStatus={status} />)}
  </>;
}
