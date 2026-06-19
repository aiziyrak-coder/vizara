export type ProductId = 'vizara_ar' | 'vizara_tour';

export type ArPlanId = 'ar_starter' | 'ar_business' | 'ar_pro' | 'ar_enterprise';
export type TourPlanId = 'tour_starter' | 'tour_business' | 'tour_pro' | 'tour_enterprise';
export type PlanId = ArPlanId | TourPlanId;

export const PRODUCTS: Record<ProductId, { id: ProductId; name: string; nameUz: string }> = {
  vizara_ar: { id: 'vizara_ar', name: 'VizaraAR', nameUz: 'VizaraAR' },
  vizara_tour: { id: 'vizara_tour', name: 'VizaraTour', nameUz: 'VizaraTour' },
};

export interface ArPlanFeatures {
  photoZone: boolean;
  modelAR: boolean;
  customBranding: boolean;
  customLogo: boolean;
  whiteLabel: boolean;
  analytics: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
}

export interface TourPlanFeatures {
  customBranding: boolean;
  customLogo: boolean;
  whiteLabel: boolean;
  analytics: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
}

export interface ArPlan {
  id: ArPlanId;
  product: 'vizara_ar';
  name: string;
  nameUz: string;
  price: number;
  description: string;
  maxModels: number;
  maxExperiences: number;
  maxFileSizeMB: number;
  features: ArPlanFeatures;
  highlight?: boolean;
  stripePriceEnvKey: string;
}

export interface TourPlan {
  id: TourPlanId;
  product: 'vizara_tour';
  name: string;
  nameUz: string;
  price: number;
  description: string;
  maxTours: number;
  maxScenesPerTour: number;
  maxFileSizeMB: number;
  features: TourPlanFeatures;
  highlight?: boolean;
  stripePriceEnvKey: string;
}

export type Plan = ArPlan | TourPlan;

export const AR_PLANS: Record<ArPlanId, ArPlan> = {
  ar_starter: {
    id: 'ar_starter',
    product: 'vizara_ar',
    name: 'Starter',
    nameUz: 'Boshlang\'ich',
    price: 5,
    description: 'VizaraAR — kichik loyihalar va sinov uchun',
    maxModels: 3,
    maxExperiences: 5,
    maxFileSizeMB: -1,
    stripePriceEnvKey: 'STRIPE_PRICE_AR_STARTER',
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
  ar_business: {
    id: 'ar_business',
    product: 'vizara_ar',
    name: 'Business',
    nameUz: 'Biznes',
    price: 15,
    description: 'VizaraAR — o\'rta hajmdagi tashkilotlar uchun',
    maxModels: 10,
    maxExperiences: 20,
    maxFileSizeMB: -1,
    stripePriceEnvKey: 'STRIPE_PRICE_AR_BUSINESS',
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
  ar_pro: {
    id: 'ar_pro',
    product: 'vizara_ar',
    name: 'Pro',
    nameUz: 'Professional',
    price: 35,
    description: 'VizaraAR — faol marketing va tadbirlar uchun',
    maxModels: 20,
    maxExperiences: 50,
    maxFileSizeMB: -1,
    highlight: true,
    stripePriceEnvKey: 'STRIPE_PRICE_AR_PRO',
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
  ar_enterprise: {
    id: 'ar_enterprise',
    product: 'vizara_ar',
    name: 'Enterprise',
    nameUz: 'Korporativ',
    price: 99,
    description: 'VizaraAR — katta tashkilotlar uchun',
    maxModels: -1,
    maxExperiences: -1,
    maxFileSizeMB: -1,
    stripePriceEnvKey: 'STRIPE_PRICE_AR_ENTERPRISE',
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

export const TOUR_PLANS: Record<TourPlanId, TourPlan> = {
  tour_starter: {
    id: 'tour_starter',
    product: 'vizara_tour',
    name: 'Starter',
    nameUz: 'Boshlang\'ich',
    price: 5,
    description: 'VizaraTour — kichik obyektlar va sinov uchun',
    maxTours: 2,
    maxScenesPerTour: 10,
    maxFileSizeMB: -1,
    stripePriceEnvKey: 'STRIPE_PRICE_TOUR_STARTER',
    features: {
      customBranding: false,
      customLogo: false,
      whiteLabel: false,
      analytics: false,
      prioritySupport: false,
      apiAccess: false,
    },
  },
  tour_business: {
    id: 'tour_business',
    product: 'vizara_tour',
    name: 'Business',
    nameUz: 'Biznes',
    price: 15,
    description: 'VizaraTour — ko\'chmas mulk va mehmonxonalar uchun',
    maxTours: 5,
    maxScenesPerTour: 30,
    maxFileSizeMB: -1,
    stripePriceEnvKey: 'STRIPE_PRICE_TOUR_BUSINESS',
    features: {
      customBranding: true,
      customLogo: false,
      whiteLabel: false,
      analytics: false,
      prioritySupport: false,
      apiAccess: false,
    },
  },
  tour_pro: {
    id: 'tour_pro',
    product: 'vizara_tour',
    name: 'Pro',
    nameUz: 'Professional',
    price: 35,
    description: 'VizaraTour — faol agentliklar uchun',
    maxTours: 20,
    maxScenesPerTour: 50,
    maxFileSizeMB: -1,
    highlight: true,
    stripePriceEnvKey: 'STRIPE_PRICE_TOUR_PRO',
    features: {
      customBranding: true,
      customLogo: true,
      whiteLabel: false,
      analytics: true,
      prioritySupport: true,
      apiAccess: false,
    },
  },
  tour_enterprise: {
    id: 'tour_enterprise',
    product: 'vizara_tour',
    name: 'Enterprise',
    nameUz: 'Korporativ',
    price: 99,
    description: 'VizaraTour — katta portfel va agentliklar uchun',
    maxTours: -1,
    maxScenesPerTour: -1,
    maxFileSizeMB: -1,
    stripePriceEnvKey: 'STRIPE_PRICE_TOUR_ENTERPRISE',
    features: {
      customBranding: true,
      customLogo: true,
      whiteLabel: true,
      analytics: true,
      prioritySupport: true,
      apiAccess: true,
    },
  },
};

export const ALL_PLANS: Record<PlanId, Plan> = {
  ...AR_PLANS,
  ...TOUR_PLANS,
};

export const AR_PLAN_LIST: ArPlan[] = Object.values(AR_PLANS);
export const TOUR_PLAN_LIST: TourPlan[] = Object.values(TOUR_PLANS);
export const PLAN_LIST: Plan[] = Object.values(ALL_PLANS);

/** @deprecated use AR_PLAN_LIST or TOUR_PLAN_LIST */
export const PLANS = ALL_PLANS;

const LEGACY_AR_MAP: Record<string, ArPlanId> = {
  starter: 'ar_starter',
  business: 'ar_business',
  pro: 'ar_pro',
  enterprise: 'ar_enterprise',
};

const LEGACY_TOUR_MAP: Record<string, TourPlanId> = {
  starter: 'tour_starter',
  business: 'tour_business',
  pro: 'tour_pro',
  enterprise: 'tour_enterprise',
};

export function normalizePlanId(planId: string | null | undefined): PlanId | null {
  if (!planId) return null;
  if (planId in ALL_PLANS) return planId as PlanId;
  if (planId in LEGACY_AR_MAP) return LEGACY_AR_MAP[planId];
  if (planId.startsWith('ar_') || planId.startsWith('tour_')) return planId as PlanId;
  return null;
}

export function isValidPlanId(id: string): id is PlanId {
  return id in ALL_PLANS;
}

export function isArPlanId(id: string): id is ArPlanId {
  return id in AR_PLANS;
}

export function isTourPlanId(id: string): id is TourPlanId {
  return id in TOUR_PLANS;
}

export function getPlanProduct(planId: string): ProductId {
  const normalized = normalizePlanId(planId);
  if (normalized && normalized in ALL_PLANS) return ALL_PLANS[normalized].product;
  return 'vizara_ar';
}

export function getPlan(planId: string | null | undefined): Plan {
  const normalized = normalizePlanId(planId);
  if (normalized) return ALL_PLANS[normalized];
  return AR_PLANS.ar_starter;
}

export function getArPlan(planId: string | null | undefined): ArPlan {
  const normalized = normalizePlanId(planId);
  if (normalized && isArPlanId(normalized)) return AR_PLANS[normalized];
  return AR_PLANS.ar_starter;
}

export function getTourPlan(planId: string | null | undefined): TourPlan {
  const normalized = normalizePlanId(planId);
  if (normalized && isTourPlanId(normalized)) return TOUR_PLANS[normalized];
  return TOUR_PLANS.tour_starter;
}

export function getPlansForProduct(product: ProductId): Plan[] {
  return product === 'vizara_ar' ? AR_PLAN_LIST : TOUR_PLAN_LIST;
}

export function getDefaultPlanId(product: ProductId): PlanId {
  return product === 'vizara_ar' ? 'ar_starter' : 'tour_starter';
}

export function mapLegacyPlanToAr(planId: string): ArPlanId {
  return LEGACY_AR_MAP[planId] || (isArPlanId(planId) ? planId : 'ar_starter');
}

export function mapLegacyPlanToTour(planId: string): TourPlanId | null {
  if (planId === 'starter') return null;
  return LEGACY_TOUR_MAP[planId] || (isTourPlanId(planId) ? planId : null);
}

export function formatLimit(value: number): string {
  return value === -1 ? 'Cheksiz' : `${value} tagacha`;
}

export function formatFileSizeLimit(mb: number): string {
  return mb === -1 ? 'Cheksiz fayl hajmi' : `${mb} MB gacha fayl hajmi`;
}

export function getArPlanFeatureList(plan: ArPlan): string[] {
  const items: string[] = [
    `${formatLimit(plan.maxModels)} 3D model`,
    `${formatLimit(plan.maxExperiences)} AR tajriba`,
    'QR kod generatsiya',
    formatFileSizeLimit(plan.maxFileSizeMB),
  ];
  if (plan.features.photoZone) items.push('Foto zona rejimi');
  if (plan.features.modelAR) items.push('3D Model WebAR');
  if (plan.features.customBranding) items.push('Brend rangi sozlash');
  if (plan.features.customLogo) items.push('Logo yuklash');
  if (plan.features.analytics) items.push('Statistika paneli');
  if (plan.features.whiteLabel) items.push('White-label');
  if (plan.features.prioritySupport) items.push('Ustuvor qo\'llab-quvvatlash');
  if (plan.features.apiAccess) items.push('API kirish');
  return items;
}

export function getTourPlanFeatureList(plan: TourPlan): string[] {
  const items: string[] = [
    `${formatLimit(plan.maxTours)} virtual tur`,
    `${formatLimit(plan.maxScenesPerTour)} sahna/tur`,
    '360° panorama viewer',
    'Hotspot navigatsiya',
    'QR kod generatsiya',
    formatFileSizeLimit(plan.maxFileSizeMB),
  ];
  if (plan.features.customBranding) items.push('Brend rangi sozlash');
  if (plan.features.customLogo) items.push('Logo yuklash');
  if (plan.features.analytics) items.push('Statistika paneli');
  if (plan.features.whiteLabel) items.push('White-label');
  if (plan.features.prioritySupport) items.push('Ustuvor qo\'llab-quvvatlash');
  if (plan.features.apiAccess) items.push('API kirish');
  return items;
}

export function getPlanFeatureList(plan: Plan): string[] {
  return plan.product === 'vizara_ar'
    ? getArPlanFeatureList(plan)
    : getTourPlanFeatureList(plan);
}
