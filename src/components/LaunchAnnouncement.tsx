import type { Locale } from "@/lib/i18n";
import { getStore } from "@/lib/store";
import { launchActive, launchStarted } from "@/lib/launch-offer";
import { slideInWindow } from "@/lib/announcement-carousel";
import { AnnouncementCarousel } from "./AnnouncementCarousel";

export async function LaunchAnnouncement({ locale }: { locale: Locale }) {
  const store = getStore();
  const [slides, campaign] = await Promise.all([store.getCarouselSlides(), store.getLaunchState()]);
  return <AnnouncementCarousel slides={slides.filter((slide) => slideInWindow(slide))} locale={locale} initialStatus={{ active: launchActive(campaign), started: launchStarted(campaign), remaining: campaign.ordersRemaining ?? null }} />;
}
