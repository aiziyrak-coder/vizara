const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  return localStorage.getItem('vizara_token');
}

export function setToken(token: string) {
  localStorage.setItem('vizara_token', token);
}

export function clearToken() {
  localStorage.removeItem('vizara_token');
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: 'same-origin',
    });

    if (res.status === 401) {
      onUnauthorized?.();
      throw new ApiError('Sessiya tugagan. Qayta kiring.', 401, 'UNAUTHORIZED');
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(
        data.error || 'So\'rovda xatolik',
        res.status,
        data.code
      );
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Internet aloqasi yo\'q yoki server ishlamayapti', 0);
  }
}

export const api = {
  health: () => request<{ status: string; platform: string; db?: string }>('/health'),

  register: (data: {
    email: string;
    password: string;
    name: string;
    organizationName: string;
  }) =>
    request<{ token: string; user: User; organization: Organization }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: User; organizations: Organization[] }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  me: () =>
    request<{ user: User; organizations: Organization[] }>('/auth/me'),

  updateOrganization: (id: string, data: Partial<Organization>) =>
    request<Organization>(`/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getModels: (orgId: string) =>
    request<Model3D[]>(`/models/${orgId}`),

  uploadModel: (orgId: string, name: string, file: File) => {
    const form = new FormData();
    form.append('name', name);
    form.append('file', file);
    return request<Model3D>(`/models/${orgId}`, {
      method: 'POST',
      body: form,
      headers: {},
    });
  },

  deleteModel: (orgId: string, modelId: string) =>
    request<{ success: boolean }>(`/models/${orgId}/${modelId}`, {
      method: 'DELETE',
    }),

  getExperiences: (orgId: string) =>
    request<Experience[]>(`/experiences/${orgId}`),

  createExperience: (
    orgId: string,
    data: { name: string; type: string; modelId?: string; config?: object }
  ) =>
    request<Experience & { arUrl: string }>(`/experiences/${orgId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  regenerateQR: (orgId: string, expId: string) =>
    request<Experience & { arUrl: string }>(
      `/experiences/${orgId}/${expId}/regenerate-qr`,
      { method: 'POST' }
    ),

  deleteExperience: (orgId: string, expId: string) =>
    request<{ success: boolean }>(`/experiences/${orgId}/${expId}`, {
      method: 'DELETE',
    }),

  getPublicExperience: (orgSlug: string, expSlug: string) =>
    request<PublicExperienceData>(
      `/experiences/public/${encodeURIComponent(orgSlug)}/${encodeURIComponent(expSlug)}`
    ),

  getTours: (orgId: string) =>
    request<VirtualTour[]>(`/tours/${orgId}`),

  createTour: (orgId: string, data: { name: string; description?: string }) =>
    request<VirtualTour & { tourUrl: string }>(`/tours/${orgId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTour: (orgId: string, tourId: string) =>
    request<TourDetail & { tourUrl: string }>(`/tours/${orgId}/${tourId}`),

  updateTour: (orgId: string, tourId: string, data: Partial<{
    name: string;
    description: string;
    startSceneId: string | null;
    isActive: boolean;
    settings: Record<string, unknown> | string | null;
  }>) =>
    request<TourDetail>(`/tours/${orgId}/${tourId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteTour: (orgId: string, tourId: string) =>
    request<{ success: boolean }>(`/tours/${orgId}/${tourId}`, { method: 'DELETE' }),

  regenerateTourQR: (orgId: string, tourId: string) =>
    request<VirtualTour & { tourUrl: string }>(`/tours/${orgId}/${tourId}/regenerate-qr`, {
      method: 'POST',
    }),

  uploadTourScene: (orgId: string, tourId: string, name: string, file: File) => {
    const form = new FormData();
    form.append('name', name);
    form.append('file', file);
    return request<TourScene>(`/tours/${orgId}/${tourId}/scenes`, {
      method: 'POST',
      body: form,
      headers: {},
    });
  },

  deleteTourScene: (orgId: string, tourId: string, sceneId: string) =>
    request<{ success: boolean }>(`/tours/${orgId}/${tourId}/scenes/${sceneId}`, {
      method: 'DELETE',
    }),

  updateTourScene: (
    orgId: string,
    tourId: string,
    sceneId: string,
    data: Partial<{
      name: string;
      description: string | null;
      pitch: number;
      yaw: number;
      hfov: number;
      order: number;
      ambientAudioUrl: string | null;
    }>
  ) =>
    request<TourScene>(`/tours/${orgId}/${tourId}/scenes/${sceneId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  replaceTourScenePanorama: (orgId: string, tourId: string, sceneId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<TourScene>(`/tours/${orgId}/${tourId}/scenes/${sceneId}/panorama`, {
      method: 'POST',
      body: form,
      headers: {},
    });
  },

  reorderTourScenes: (orgId: string, tourId: string, sceneIds: string[]) =>
    request<TourDetail>(`/tours/${orgId}/${tourId}/scenes/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ sceneIds }),
    }),

  uploadTourMedia: (orgId: string, tourId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ mediaUrl: string; mediaType: string }>(`/tours/${orgId}/${tourId}/media`, {
      method: 'POST',
      body: form,
      headers: {},
    });
  },

  createTourHotspot: (
    orgId: string,
    tourId: string,
    sceneId: string,
    data: Partial<TourHotspotInput>
  ) =>
    request<TourHotspot>(`/tours/${orgId}/${tourId}/scenes/${sceneId}/hotspots`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTourHotspot: (
    orgId: string,
    tourId: string,
    hotspotId: string,
    data: Partial<TourHotspotInput>
  ) =>
    request<TourHotspot>(`/tours/${orgId}/${tourId}/hotspots/${hotspotId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteTourHotspot: (orgId: string, tourId: string, hotspotId: string) =>
    request<{ success: boolean }>(`/tours/${orgId}/${tourId}/hotspots/${hotspotId}`, {
      method: 'DELETE',
    }),

  getPublicTour: (orgSlug: string, tourSlug: string) =>
    request<PublicTourData>(
      `/tours/public/${encodeURIComponent(orgSlug)}/${encodeURIComponent(tourSlug)}`
    ),

  getBillingStatus: (orgId: string) =>
    request<BillingStatus>(`/billing/status/${orgId}`),

  createCheckout: (orgId: string, planId: string, product: string) =>
    request<{ url?: string; demo?: boolean; message?: string; subscription?: Subscription; plan?: PlanInfo; product?: string }>(
      `/billing/checkout/${orgId}`,
      { method: 'POST', body: JSON.stringify({ planId, product }) }
    ),

  activateDemo: (orgId: string, planId: string, product: string) =>
    request<{ subscription: Subscription; plan: PlanInfo; product: string }>(
      `/billing/activate-demo/${orgId}`,
      { method: 'POST', body: JSON.stringify({ planId, product }) }
    ),

  getPlans: (product?: string) =>
    request<PlanInfo[]>(`/billing/plans${product ? `?product=${product}` : ''}`),

  aiStatus: () =>
    request<{ enabled: boolean; model?: string }>('/ai/status'),

  aiTourChat: (data: {
    orgSlug: string;
    tourSlug: string;
    messages: { role: 'user' | 'assistant'; content: string }[];
    locale?: string;
    currentSceneId?: string;
  }) =>
    request<{ reply: string }>('/ai/tour-chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  aiChat: (data: {
    messages: { role: 'user' | 'assistant'; content: string }[];
    locale?: string;
    orgId?: string;
    pageContext?: string;
  }) =>
    request<{ reply: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  aiGenerate: (data: {
    task: string;
    context: Record<string, unknown>;
    locale?: string;
    orgId?: string;
  }) =>
    request<{ result: Record<string, string>; task: string }>('/ai/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Subscription {
  id: string;
  product?: string;
  status: string;
  planId?: string;
  currentPeriodEnd?: string;
  stripeCustomerId?: string;
}

export interface PlanFeatures {
  photoZone?: boolean;
  modelAR?: boolean;
  customBranding?: boolean;
  customLogo?: boolean;
  whiteLabel?: boolean;
  analytics?: boolean;
  prioritySupport?: boolean;
  apiAccess?: boolean;
}

export interface PlanInfo {
  id: string;
  product?: string;
  name: string;
  nameUz: string;
  price: number;
  description: string;
  maxModels?: number;
  maxExperiences?: number;
  maxTours?: number;
  maxScenesPerTour?: number;
  maxFileSizeMB: number;
  features: PlanFeatures;
  featureList?: string[];
  highlight?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  brandColor: string;
  website?: string;
  subscriptions?: Subscription[];
  /** @deprecated use subscriptions */
  subscription?: Subscription;
  _count?: { models: number; experiences: number };
}

export interface Model3D {
  id: string;
  name: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface Experience {
  id: string;
  name: string;
  slug: string;
  type: string;
  modelId?: string;
  qrCodeUrl?: string;
  isActive: boolean;
  createdAt: string;
  arUrl?: string;
}

export interface PublicExperienceData {
  experience: {
    id: string;
    name: string;
    type: string;
    config?: Record<string, unknown>;
  };
  organization: {
    name: string;
    slug: string;
    brandColor: string;
    logoUrl?: string;
    website?: string;
  };
  model?: Model3D;
  plan?: { id: string; name: string; whiteLabel: boolean };
}

export interface ProductBillingStatus {
  subscription: Subscription | null;
  subscriptionActive: boolean;
  plan: PlanInfo;
}

export interface BillingStatus {
  ar: ProductBillingStatus & {
    usage: { models: number; experiences: number };
  };
  tour: ProductBillingStatus & {
    usage: { tours: number };
  };
  stripeConfigured: boolean;
  demoMode: boolean;
}

export interface VirtualTour {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  startSceneId?: string | null;
  coverUrl?: string | null;
  qrCodeUrl?: string | null;
  isActive: boolean;
  settings?: string | null;
  createdAt: string;
  tourUrl?: string;
  _count?: { scenes: number };
}

export interface TourHotspotInput {
  type: string;
  pitch: number;
  yaw: number;
  title?: string;
  text?: string;
  body?: string;
  mediaUrl?: string;
  mediaType?: string;
  linkUrl?: string;
  icon?: string;
  targetSceneId?: string;
}

export interface TourScene {
  id: string;
  name: string;
  description?: string | null;
  panoramaUrl: string;
  pitch: number;
  yaw: number;
  hfov: number;
  ambientAudioUrl?: string | null;
  order: number;
  tourId: string;
  hotspots: TourHotspot[];
  createdAt: string;
}

export interface TourHotspot {
  id: string;
  sceneId?: string;
  type: string;
  pitch: number;
  yaw: number;
  title?: string | null;
  text?: string | null;
  body?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  linkUrl?: string | null;
  icon?: string | null;
  order?: number;
  targetSceneId?: string | null;
  createdAt?: string;
}

export interface TourDetail extends VirtualTour {
  scenes: TourScene[];
}

export interface PublicTourData {
  tour: {
    id: string;
    name: string;
    description?: string | null;
    startSceneId: string;
    settings?: string | null;
  };
  organization: {
    name: string;
    slug: string;
    brandColor: string;
    logoUrl?: string;
    website?: string;
  };
  scenes: TourScene[];
  plan?: { id: string; name: string; whiteLabel: boolean };
}

export { ApiError };
