import { useRef, useState } from 'react';
import {
  Navigation, Info, Image, Video, Music, Link2, Flag,
} from 'lucide-react';
import { TOUR_HOTSPOT_TYPES, TOUR_MARKER_ICONS, type TourHotspotType } from '../../../shared/tour-types';
import { TourPanoramaPicker } from '../TourPanoramaPicker';
import { api } from '../../lib/api';
import { useI18n } from '../../lib/i18n-context';
import { AiGenerateButton } from '../ai/AiGenerateButton';

export interface HotspotFormState {
  type: TourHotspotType;
  title: string;
  text: string;
  body: string;
  linkUrl: string;
  targetSceneId: string;
  pitch: string;
  yaw: string;
  mediaUrl: string;
  mediaType: string;
  icon: string;
}

export const emptyHotspotForm = (): HotspotFormState => ({
  type: 'info',
  title: '',
  text: '',
  body: '',
  linkUrl: '',
  targetSceneId: '',
  pitch: '0',
  yaw: '0',
  mediaUrl: '',
  mediaType: '',
  icon: '',
});

const TYPE_ICONS: Record<string, typeof Info> = {
  scene: Navigation,
  info: Info,
  image: Image,
  video: Video,
  audio: Music,
  link: Link2,
  banner: Flag,
};

interface TourHotspotEditorProps {
  orgId: string;
  tourId: string;
  scene: {
    id: string;
    name: string;
    panoramaUrl: string;
    pitch: number;
    yaw: number;
    hfov: number;
  };
  otherScenes: { id: string; name: string }[];
  form: HotspotFormState;
  onChange: (form: HotspotFormState) => void;
  onPick: (pitch: number, yaw: number) => void;
  uploading?: boolean;
  onUploadingChange?: (v: boolean) => void;
  hidePicker?: boolean;
}

export function TourHotspotEditor({
  orgId,
  tourId,
  scene,
  otherScenes,
  form,
  onChange,
  onPick,
  uploading,
  onUploadingChange,
  hidePicker = false,
}: TourHotspotEditorProps) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [localUploading, setLocalUploading] = useState(false);
  const isUploading = uploading ?? localUploading;

  const set = (patch: Partial<HotspotFormState>) => onChange({ ...form, ...patch });

  const handleMediaUpload = async (file: File | null) => {
    if (!file) return;
    onUploadingChange?.(true);
    setLocalUploading(true);
    try {
      const result = await api.uploadTourMedia(orgId, tourId, file);
      set({ mediaUrl: result.mediaUrl, mediaType: result.mediaType });
    } finally {
      setLocalUploading(false);
      onUploadingChange?.(false);
    }
  };

  const needsMedia = ['image', 'video', 'audio', 'banner'].includes(form.type);
  const needsLink = form.type === 'link';
  const needsScene = form.type === 'scene';

  return (
    <div className="space-y-4">
      <div>
        <label className="label">{t('tours.hotspotType')}</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TOUR_HOTSPOT_TYPES.map((type) => {
            const Icon = TYPE_ICONS[type] || Info;
            return (
              <button
                key={type}
                type="button"
                onClick={() => set({ type })}
                className={`tour-type-chip ${form.type === type ? 'tour-type-chip--active' : ''}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{t(`tours.hotspotType_${type}` as 'tours.hotspotType_info')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {!hidePicker && (
        <TourPanoramaPicker
          sceneId={scene.id}
          sceneName={scene.name}
          panoramaUrl={scene.panoramaUrl}
          pitch={scene.pitch}
          yaw={scene.yaw}
          hfov={scene.hfov}
          onPick={onPick}
        />
      )}

      {(needsScene || form.type === 'scene') && (
        <div>
          <label className="label">{t('tours.markerStyle')}</label>
          <div className="grid grid-cols-4 gap-2">
            {TOUR_MARKER_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => set({ icon })}
                className={`tour-type-chip text-xs ${form.icon === icon ? 'tour-type-chip--active' : ''}`}
              >
                {t(`tours.marker_${icon}` as 'tours.marker_door')}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-[#334155]">{t('tours.hotspotContent')}</span>
          <AiGenerateButton
            task="hotspot"
            context={{
              orgId,
              sceneName: scene.name,
              hotspotType: form.type,
              existingTitle: form.title,
              existingText: form.text,
            }}
            onResult={(result) => set({
              title: result.title || form.title,
              text: result.text || form.text,
              body: result.body || form.body,
            })}
            className="!py-1 !px-2.5 text-xs"
          />
        </div>
        <div>
          <label className="label">{t('tours.hotspotTitle')}</label>
          <input value={form.title} onChange={(e) => set({ title: e.target.value })} className="input" placeholder={t('tours.hotspotTitlePh')} />
        </div>
        <div>
          <label className="label">{t('tours.hotspotLabel')}</label>
          <input value={form.text} onChange={(e) => set({ text: e.target.value })} className="input" placeholder={t('tours.hotspotLabelPh')} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">{t('tours.hotspotBody')}</label>
          <textarea value={form.body} onChange={(e) => set({ body: e.target.value })} className="input min-h-[88px]" placeholder={t('tours.hotspotBodyPh')} rows={3} />
        </div>

        {needsScene && (
          <div className="sm:col-span-2">
            <label className="label">{t('tours.targetScene')}</label>
            <select value={form.targetSceneId} onChange={(e) => set({ targetSceneId: e.target.value })} required className="input">
              <option value="">{t('tours.selectScene')}</option>
              {otherScenes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {(needsMedia || form.type === 'info') && (
          <div className="sm:col-span-2">
            <label className="label">{t('tours.hotspotMedia')}</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*,audio/*,.gif"
              className="input file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[#f1f5f9] file:text-sm"
              onChange={(e) => handleMediaUpload(e.target.files?.[0] || null)}
            />
            {isUploading && <p className="text-xs text-secondary mt-1">{t('tours.mediaUploading')}</p>}
            {form.mediaUrl && (
              <p className="text-xs text-[var(--brand)] mt-1 truncate">{form.mediaUrl}</p>
            )}
          </div>
        )}

        {needsLink && (
          <div className="sm:col-span-2">
            <label className="label">{t('tours.hotspotLink')}</label>
            <input value={form.linkUrl} onChange={(e) => set({ linkUrl: e.target.value })} className="input" placeholder="https://" type="url" />
          </div>
        )}

        <div>
          <label className="label">{t('tours.pitch')}</label>
          <input type="number" step="0.1" value={form.pitch} onChange={(e) => set({ pitch: e.target.value })} className="input" />
        </div>
        <div>
          <label className="label">{t('tours.yaw')}</label>
          <input type="number" step="0.1" value={form.yaw} onChange={(e) => set({ yaw: e.target.value })} className="input" />
        </div>
      </div>
    </div>
  );
}
