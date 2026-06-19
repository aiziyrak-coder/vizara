import { X, ExternalLink, Image, Video, Music, Info, MapPin, Link2 } from 'lucide-react';
import type { TourHotspotPayload } from '../../../shared/tour-types';
import { isMediaGif } from '../../../shared/tour-types';
import { resolveUploadUrl } from '../../lib/assets';
import { useI18n } from '../../lib/i18n-context';

interface TourHotspotModalProps {
  hotspot: TourHotspotPayload;
  onClose: () => void;
}

function HotspotTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'image': return <Image className="w-5 h-5" />;
    case 'video': return <Video className="w-5 h-5" />;
    case 'audio': return <Music className="w-5 h-5" />;
    case 'link': return <Link2 className="w-5 h-5" />;
    case 'scene': return <MapPin className="w-5 h-5" />;
    default: return <Info className="w-5 h-5" />;
  }
}

export function TourHotspotModal({ hotspot, onClose }: TourHotspotModalProps) {
  const { t } = useI18n();
  const mediaUrl = hotspot.mediaUrl ? resolveUploadUrl(hotspot.mediaUrl) : '';
  const title = hotspot.title || hotspot.text || t('tours.hotspot');

  return (
    <div className="tour-hotspot-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className={`tour-hotspot-modal ${hotspot.type === 'banner' ? 'tour-hotspot-modal--banner' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tour-hotspot-modal-header">
          <div className="flex items-center gap-2 min-w-0">
            <span className="tour-hotspot-modal-icon"><HotspotTypeIcon type={hotspot.type} /></span>
            <h3 className="font-bold truncate">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="icon-btn rounded-full" aria-label={t('common.close')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="tour-hotspot-modal-body">
          {hotspot.body && (
            <p className="tour-hotspot-modal-text whitespace-pre-wrap">{hotspot.body}</p>
          )}

          {mediaUrl && hotspot.mediaType === 'video' && (
            <video src={mediaUrl} controls playsInline className="tour-hotspot-modal-media" />
          )}

          {mediaUrl && hotspot.mediaType === 'audio' && (
            <audio src={mediaUrl} controls className="tour-hotspot-modal-audio w-full" />
          )}

          {mediaUrl && (hotspot.mediaType === 'image' || hotspot.mediaType === 'gif' || isMediaGif(mediaUrl, hotspot.mediaType)) && (
            <img src={mediaUrl} alt="" className="tour-hotspot-modal-media" />
          )}

          {mediaUrl && !hotspot.mediaType && (
            <img src={mediaUrl} alt="" className="tour-hotspot-modal-media" />
          )}

          {hotspot.linkUrl && (
            <a
              href={hotspot.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full mt-3"
            >
              <ExternalLink className="w-4 h-4" />
              {t('tours.openLink')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
