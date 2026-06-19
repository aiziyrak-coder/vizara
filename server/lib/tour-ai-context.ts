import { prisma } from './prisma.js';
import { hasActiveSubscription } from '../middleware/subscription.js';
import { isSafeSlug } from './file-validation.js';
import type { TourGuideContext } from './openai.js';

export async function loadTourGuideContext(
  orgSlug: string,
  tourSlug: string,
  currentSceneId?: string
): Promise<TourGuideContext | null> {
  if (!isSafeSlug(orgSlug) || !isSafeSlug(tourSlug)) return null;

  const org = await prisma.organization.findFirst({ where: { slug: orgSlug } });
  if (!org) return null;

  const active = await hasActiveSubscription(org.id, 'vizara_tour');
  if (!active) return null;

  const tour = await prisma.virtualTour.findFirst({
    where: { organizationId: org.id, slug: tourSlug, isActive: true },
    include: {
      scenes: {
        orderBy: { order: 'asc' },
        include: { hotspots: true },
      },
    },
  });

  if (!tour || tour.scenes.length === 0) return null;

  const currentScene = currentSceneId
    ? tour.scenes.find((s) => s.id === currentSceneId)
    : tour.scenes[0];

  return {
    orgName: org.name,
    tourName: tour.name,
    description: tour.description,
    currentSceneName: currentScene?.name,
    scenes: tour.scenes.map((scene) => ({
      name: scene.name,
      description: scene.description,
      hotspots: scene.hotspots.map((h) => ({
        type: h.type,
        title: h.title,
        text: h.text,
        body: h.body,
      })),
    })),
  };
}
