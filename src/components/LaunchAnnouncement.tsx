import type { Locale } from "@/lib/i18n";
import { getStore } from "@/lib/store";
import { launchActive } from "@/lib/launch-offer";
import { AnnouncementCarousel } from "./AnnouncementCarousel";

export async function LaunchAnnouncement({ locale }: { locale: Locale }) {
  const store = getStore();
  const [slides, campaign] = await Promise.all([store.getCarouselSlides(), store.getLaunchState()]);
  return <AnnouncementCarousel slides={slides} locale={locale} initialStatus={{ active: launchActive(campaign), remaining: campaign.ordersRemaining ?? null }} />;
}
