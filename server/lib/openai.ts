import OpenAI from 'openai';
import { logger } from './logger.js';

const DEFAULT_MODEL = 'gpt-4o';
const FAST_MODEL = 'gpt-4o-mini';

let client: OpenAI | null = null;

export function isAiEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function getClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error('AI_NOT_CONFIGURED');
  }
  if (!client) {
    client = new OpenAI({ apiKey: key });
  }
  return client;
}

function resolveModel(fast = false): string {
  const configured = process.env.AI_MODEL?.trim();
  if (configured) return configured;
  return fast ? FAST_MODEL : DEFAULT_MODEL;
}

const LOCALE_NAMES: Record<string, string> = {
  uz: "O'zbek (Lotin)",
  'uz-Cyrl': 'Ўзбек (Кирил)',
  ru: 'Русский',
  en: 'English',
};

export function localeLabel(locale?: string): string {
  if (!locale) return LOCALE_NAMES.uz;
  return LOCALE_NAMES[locale] || locale;
}

const PLATFORM_SYSTEM = `You are Vizara AI — an expert assistant for the Vizara platform (AR photo zones, 3D model AR, and 360° virtual tours).
Help users create compelling content, optimize tours, write hotspot copy, and grow their business with immersive experiences.
Be concise, practical, and professional. When writing user-facing text, match the requested language exactly.
Never invent URLs, prices, or features that don't exist on Vizara.`;

export type AiTask =
  | 'hotspot'
  | 'tour_description'
  | 'scene_description'
  | 'experience'
  | 'organization'
  | 'improve_text'
  | 'marketing';

const TASK_SCHEMAS: Record<AiTask, { fields: string[]; instruction: string }> = {
  hotspot: {
    fields: ['title', 'text', 'body'],
    instruction: `Generate hotspot content for a 360° virtual tour panorama marker.
Return JSON: { "title": "short title (max 60 chars)", "text": "short label on marker (max 40 chars)", "body": "detailed description (2-4 sentences, engaging)" }`,
  },
  tour_description: {
    fields: ['description'],
    instruction: `Write a compelling virtual tour description (2-3 sentences) that invites visitors to explore.
Return JSON: { "description": "..." }`,
  },
  scene_description: {
    fields: ['description'],
    instruction: `Write a short scene/room description for a 360° panorama (1-2 sentences).
Return JSON: { "description": "..." }`,
  },
  experience: {
    fields: ['name', 'title', 'subtitle', 'description'],
    instruction: `Suggest AR experience branding copy (photo zone or AR showcase).
Return JSON: { "name": "experience name", "title": "overlay title", "subtitle": "overlay subtitle", "description": "short description" }`,
  },
  organization: {
    fields: ['description', 'tagline'],
    instruction: `Write organization branding copy for an immersive tech business.
Return JSON: { "description": "2-3 sentence org description", "tagline": "short catchy tagline (max 80 chars)" }`,
  },
  improve_text: {
    fields: ['text'],
    instruction: `Improve the provided text: clearer, more engaging, same meaning. Keep similar length unless context asks otherwise.
Return JSON: { "text": "improved text" }`,
  },
  marketing: {
    fields: ['headline', 'subheadline', 'cta', 'bullets'],
    instruction: `Create marketing copy for Vizara AR/tour services.
Return JSON: { "headline": "...", "subheadline": "...", "cta": "call to action", "bullets": ["point1", "point2", "point3"] }`,
  },
};

export function isValidAiTask(task: string): task is AiTask {
  return task in TASK_SCHEMAS;
}

export async function chatWithAi(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  options?: { orgName?: string; locale?: string; fast?: boolean }
): Promise<string> {
  const openai = getClient();
  const lang = localeLabel(options?.locale);
  const contextParts = [
    PLATFORM_SYSTEM,
    `Respond in: ${lang}.`,
    options?.orgName ? `User organization: ${options.orgName}.` : '',
  ].filter(Boolean);

  const response = await openai.chat.completions.create({
    model: resolveModel(options?.fast),
    temperature: 0.7,
    max_tokens: 1200,
    messages: [
      { role: 'system', content: contextParts.join('\n') },
      ...messages.filter((m) => m.role !== 'system'),
    ],
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) throw new Error('AI_EMPTY_RESPONSE');
  return content;
}

export async function generateAiContent(
  task: AiTask,
  context: Record<string, unknown>,
  locale?: string
): Promise<Record<string, string>> {
  const schema = TASK_SCHEMAS[task];
  const openai = getClient();
  const lang = localeLabel(locale);

  const contextJson = JSON.stringify(context, null, 0).slice(0, 4000);
  const userPrompt = `${schema.instruction}

Language: ${lang}
Context: ${contextJson}

Return ONLY valid JSON with these fields: ${schema.fields.join(', ')}. No markdown.`;

  const response = await openai.chat.completions.create({
    model: resolveModel(true),
    temperature: 0.75,
    max_tokens: 800,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: PLATFORM_SYSTEM },
      { role: 'user', content: userPrompt },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error('AI_EMPTY_RESPONSE');

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    logger.warn('AI JSON parse failed', { task, raw: raw.slice(0, 200) });
    throw new Error('AI_INVALID_JSON');
  }

  const result: Record<string, string> = {};
  for (const field of schema.fields) {
    const val = parsed[field];
    if (val !== undefined && val !== null) {
      if (field === 'bullets' && Array.isArray(val)) {
        result[field] = val.map(String).join('\n• ');
      } else {
        result[field] = String(val).trim();
      }
    }
  }

  if (Object.keys(result).length === 0) {
    throw new Error('AI_EMPTY_RESPONSE');
  }

  return result;
}

export interface TourGuideScene {
  name: string;
  description?: string | null;
  hotspots: Array<{
    type: string;
    title?: string | null;
    text?: string | null;
    body?: string | null;
  }>;
}

export interface TourGuideContext {
  orgName: string;
  tourName: string;
  description?: string | null;
  currentSceneName?: string;
  scenes: TourGuideScene[];
}

const TOUR_GUIDE_SYSTEM = `You are Vizara Tour Guide AI — a knowledgeable, friendly guide inside a live 360° virtual tour.
Answer visitor questions using the tour information provided (scenes, hotspots, descriptions).
Help visitors navigate between rooms, explain points of interest, and make the experience engaging.
If the answer is not in the tour data, say honestly that this tour does not include that information.
Keep answers clear and concise (2-5 sentences unless the visitor asks for detail).
Never invent prices, opening hours, or facts not supported by the tour context.`;

export async function chatAsTourGuide(
  messages: { role: 'user' | 'assistant'; content: string }[],
  context: TourGuideContext,
  locale?: string
): Promise<string> {
  const openai = getClient();
  const lang = localeLabel(locale);
  const contextJson = JSON.stringify(context, null, 0).slice(0, 7000);

  const response = await openai.chat.completions.create({
    model: resolveModel(true),
    temperature: 0.65,
    max_tokens: 900,
    messages: [
      {
        role: 'system',
        content: `${TOUR_GUIDE_SYSTEM}\nRespond in: ${lang}.\nTour context JSON:\n${contextJson}`,
      },
      ...messages.slice(-16).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content.slice(0, 2000),
      })),
    ],
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) throw new Error('AI_EMPTY_RESPONSE');
  return content;
}
