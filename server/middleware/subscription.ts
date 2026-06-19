import { prisma } from '../lib/prisma.js';
import { getOrgPlan } from '../lib/plans.js';

export async function hasActiveSubscription(organizationId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({
    where: { organizationId },
  });

  if (!sub) return false;

  if (sub.status === 'active' || sub.status === 'trialing') {
    if (sub.currentPeriodEnd && sub.currentPeriodEnd < new Date()) {
      return false;
    }
    return true;
  }

  return false;
}

export async function getSubscriptionWithPlan(organizationId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { organizationId },
  });
  const plan = await getOrgPlan(organizationId);
  const active = await hasActiveSubscription(organizationId);
  return { subscription: sub, plan, active };
}

export async function checkModelLimit(organizationId: string): Promise<{ ok: boolean; message?: string }> {
  const { plan, active } = await getSubscriptionWithPlan(organizationId);
  if (!active) {
    return { ok: false, message: 'Faol obuna talab qilinadi. Tarif rejasini tanlang.' };
  }
  if (plan.maxModels === -1) return { ok: true };

  const count = await prisma.model3D.count({ where: { organizationId } });
  if (count >= plan.maxModels) {
    return {
      ok: false,
      message: `${plan.nameUz} tarifida maksimal ${plan.maxModels} ta model. Yuqori tarifga o'ting.`,
    };
  }
  return { ok: true };
}

export async function checkExperienceLimit(organizationId: string): Promise<{ ok: boolean; message?: string }> {
  const { plan, active } = await getSubscriptionWithPlan(organizationId);
  if (!active) {
    return { ok: false, message: 'Faol obuna talab qilinadi. Tarif rejasini tanlang.' };
  }
  if (plan.maxExperiences === -1) return { ok: true };

  const count = await prisma.experience.count({ where: { organizationId } });
  if (count >= plan.maxExperiences) {
    return {
      ok: false,
      message: `${plan.nameUz} tarifida maksimal ${plan.maxExperiences} ta tajriba. Yuqori tarifga o'ting.`,
    };
  }
  return { ok: true };
}

export async function checkExperienceType(
  organizationId: string,
  type: string
): Promise<{ ok: boolean; message?: string }> {
  const plan = await getOrgPlan(organizationId);
  if (type === 'photo_zone' && !plan.features.photoZone) {
    return {
      ok: false,
      message: `Foto Zona hozirgi tarifda mavjud emas. Tarif: ${plan.nameUz}.`,
    };
  }
  if (type === 'model_ar' && !plan.features.modelAR) {
    return {
      ok: false,
      message: `3D Model AR faqat Business va yuqori tariflarda mavjud. Hozirgi tarif: ${plan.nameUz}.`,
    };
  }
  return { ok: true };
}

export async function getMaxFileSizeBytes(organizationId: string): Promise<number> {
  const plan = await getOrgPlan(organizationId);
  if (plan.maxFileSizeMB === -1) return Infinity;
  return plan.maxFileSizeMB * 1024 * 1024;
}
