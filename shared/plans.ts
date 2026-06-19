export type PlanId = 'starter' | 'business' | 'pro' | 'enterprise';

export interface PlanFeatures {
  photoZone: boolean;
  modelAR: boolean;
  customBranding: boolean;
  customLogo: boolean;
  whiteLabel: boolean;
  analytics: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  nameUz: string;
  price: number;
  description: string;
  maxModels: number;
  maxExperiences: number;
  maxFileSizeMB: number;
  features: PlanFeatures;
  highlight?: boolean;
  stripePriceEnvKey: string;
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    nameUz: 'Boshlang\'ich',
    price: 5,
    description: 'Kichik loyihalar va sinov uchun',
    maxModels: 3,
    maxExperiences: 5,
    maxFileSizeMB: -1,
    stripePriceEnvKey: 'STRIPE_PRICE_STARTER',
    features: {
      photoZone: true,
      modelAR: false,
      customBranding: false,
      customLogo: false,
      whiteLabel: false,
      analytics: false,
      prioritySupport: false,
      apiAccess: false,
    },
  },
  business: {
    id: 'business',
    name: 'Business',
    nameUz: 'Biznes',
    price: 15,
    description: 'O\'rta hajmdagi tashkilotlar uchun',
    maxModels: 10,
    maxExperiences: 20,
    maxFileSizeMB: -1,
    stripePriceEnvKey: 'STRIPE_PRICE_BUSINESS',
    features: {
      photoZone: true,
      modelAR: true,
      customBranding: true,
      customLogo: false,
      whiteLabel: false,
      analytics: false,
      prioritySupport: false,
      apiAccess: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    nameUz: 'Professional',
    price: 35,
    description: 'Faol marketing va tadbirlar uchun',
    maxModels: 20,
    maxExperiences: 50,
    maxFileSizeMB: -1,
    highlight: true,
    stripePriceEnvKey: 'STRIPE_PRICE_PRO',
    features: {
      photoZone: true,
      modelAR: true,
      customBranding: true,
      customLogo: true,
      whiteLabel: false,
      analytics: true,
      prioritySupport: true,
      apiAccess: false,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    nameUz: 'Korporativ',
    price: 99,
    description: 'Katta tashkilotlar va agentliklar uchun',
    maxModels: -1,
    maxExperiences: -1,
    maxFileSizeMB: -1,
    stripePriceEnvKey: 'STRIPE_PRICE_ENTERPRISE',
    features: {
      photoZone: true,
      modelAR: true,
      customBranding: true,
      customLogo: true,
      whiteLabel: true,
      analytics: true,
      prioritySupport: true,
      apiAccess: true,
    },
  },
};

export const PLAN_LIST: Plan[] = Object.values(PLANS);

export function isValidPlanId(id: string): id is PlanId {
  return id in PLANS;
}

export function getPlan(planId: string | null | undefined): Plan {
  if (planId && isValidPlanId(planId)) return PLANS[planId];
  return PLANS.starter;
}

export function formatLimit(value: number): string {
  return value === -1 ? 'Cheksiz' : `${value} tagacha`;
}

export function formatFileSizeLimit(mb: number): string {
  return mb === -1 ? 'Cheksiz fayl hajmi' : `${mb} MB gacha fayl hajmi`;
}

export function getPlanFeatureList(plan: Plan): string[] {
  const items: string[] = [
    `${formatLimit(plan.maxModels)} 3D model`,
    `${formatLimit(plan.maxExperiences)} AR tajriba`,
    `QR kod generatsiya`,
    formatFileSizeLimit(plan.maxFileSizeMB),
  ];

  if (plan.features.photoZone) items.push('Foto zona rejimi');
  if (plan.features.modelAR) items.push('3D Model WebAR');
  if (plan.features.customBranding) items.push('Brend rangi sozlash');
  if (plan.features.customLogo) items.push('Logo yuklash');
  if (plan.features.analytics) items.push('Statistika paneli');
  if (plan.features.whiteLabel) items.push('White-label (Vizara logosiz)');
  if (plan.features.prioritySupport) items.push('Ustuvor qo\'llab-quvvatlash');
  if (plan.features.apiAccess) items.push('API kirish');

  return items;
}
