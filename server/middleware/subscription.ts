import { prisma } from '../lib/prisma.js';
import { getOrgPlanForProduct, getOrgSubscription } from '../lib/plans.js';
import type { ProductId } from '../../shared/plans.js';

function isSubRecordActive(sub: { status: string; currentPeriodEnd: Date | null } | null): boolean {
  if (!sub) return false;
  if (sub.status !== 'active' && sub.status !== 'trialing') return false;
  if (sub.currentPeriodEnd && sub.currentPeriodEnd < new Date()) return false;
  return true;
}

export async function hasActiveSubscription(
  organizationId: string,
  product: ProductId = 'vizara_ar'
): Promise<boolean> {
  const sub = await getOrgSubscription(organizationId, product);
  return isSubRecordActive(sub);
}

export async function getSubscriptionWithPlan(organizationId: string, product: ProductId) {
  const sub = await getOrgSubscription(organizationId, product);
  const plan = await getOrgPlanForProduct(organizationId, product);
  const active = isSubRecordActive(sub);
  return { subscription: sub, plan, active };
}

export async function checkModelLimit(organizationId: string): Promise<{ ok: boolean; message?: string }> {
  const { plan, active } = await getSubscriptionWithPlan(organizationId, 'vizara_ar');
  if (!active) {
    return { ok: false, message: 'VizaraAR obunasi talab qilinadi. Tarif rejasini tanlang.' };
  }
  if (plan.maxModels === -1) return { ok: true };

  const count = await prisma.model3D.count({ where: { organizationId } });
  if (count >= plan.maxModels) {
    return {
      ok: false,
      message: `VizaraAR ${plan.nameUz} tarifida maksimal ${plan.maxModels} ta model.`,
    };
  }
  return { ok: true };
}

export async function checkExperienceLimit(organizationId: string): Promise<{ ok: boolean; message?: string }> {
  const { plan, active } = await getSubscriptionWithPlan(organizationId, 'vizara_ar');
  if (!active) {
    return { ok: false, message: 'VizaraAR obunasi talab qilinadi. Tarif rejasini tanlang.' };
  }
  if (plan.maxExperiences === -1) return { ok: true };

  const count = await prisma.experience.count({ where: { organizationId } });
  if (count >= plan.maxExperiences) {
    return {
      ok: false,
      message: `VizaraAR ${plan.nameUz} tarifida maksimal ${plan.maxExperiences} ta tajriba.`,
    };
  }
  return { ok: true };
}

export async function checkExperienceType(
  organizationId: string,
  type: string
): Promise<{ ok: boolean; message?: string }> {
  const plan = await getOrgPlanForProduct(organizationId, 'vizara_ar');
  if (type === 'photo_zone' && !plan.features.photoZone) {
    return { ok: false, message: `Foto Zona hozirgi VizaraAR tarifda mavjud emas.` };
  }
  if (type === 'model_ar' && !plan.features.modelAR) {
    return {
      ok: false,
      message: `3D Model AR VizaraAR Business va yuqori tariflarda mavjud.`,
    };
  }
  return { ok: true };
}

export async function checkSceneLimit(
  organizationId: string,
  currentSceneCount: number,
): Promise<{ ok: boolean; message?: string }> {
  const { plan, active } = await getSubscriptionWithPlan(organizationId, 'vizara_tour');
  if (!active) {
    return { ok: false, message: 'VizaraTour obunasi talab qilinadi. Tarif rejasini tanlang.' };
  }
  if (plan.maxScenesPerTour === -1) return { ok: true };
  if (currentSceneCount >= plan.maxScenesPerTour) {
    return {
      ok: false,
      message: `VizaraTour ${plan.nameUz} tarifida har turda maksimal ${plan.maxScenesPerTour} ta sahna.`,
    };
  }
  return { ok: true };
}

export async function checkTourLimit(organizationId: string): Promise<{ ok: boolean; message?: string }> {
  const { plan, active } = await getSubscriptionWithPlan(organizationId, 'vizara_tour');
  if (!active) {
    return { ok: false, message: 'VizaraTour obunasi talab qilinadi. Tarif rejasini tanlang.' };
  }
  if (plan.maxTours === -1) return { ok: true };

  const count = await prisma.virtualTour.count({ where: { organizationId } });
  if (count >= plan.maxTours) {
    return {
      ok: false,
      message: `VizaraTour ${plan.nameUz} tarifida maksimal ${plan.maxTours} ta virtual tur.`,
    };
  }
  return { ok: true };
}

export async function getMaxFileSizeBytes(organizationId: string, product: ProductId = 'vizara_ar'): Promise<number> {
  const plan = await getOrgPlanForProduct(organizationId, product);
  if (plan.maxFileSizeMB === -1) return Infinity;
  return plan.maxFileSizeMB * 1024 * 1024;
}
