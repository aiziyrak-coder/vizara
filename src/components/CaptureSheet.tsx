import { Share2, Download, X } from 'lucide-react';
import type { CaptureResult } from '../utils/capture';
import { downloadCapture, shareCapture } from '../utils/capture';
import { useI18n } from '../lib/i18n-context';

interface CaptureSheetProps {
  result: CaptureResult;
  onClose: () => void;
}

export function CaptureSheet({ result, onClose }: CaptureSheetProps) {
  const { t } = useI18n();

  const handleShare = async () => {
    try {
      await shareCapture(result);
    } catch {
      // Preview stays open for manual save
    }
  };

  const handleDownload = async () => {
    try {
      await downloadCapture(result);
    } catch {
      // User can long-press the preview image
    }
  };

  return (
    <div className="capture-sheet-backdrop" role="dialog" aria-modal="true" aria-label={t('ar.capture')}>
      <div className="capture-sheet">
        <div className="capture-sheet-header">
          <p className="capture-sheet-title">{t('ar.photoReady')}</p>
          <button type="button" onClick={onClose} className="icon-btn rounded-full" aria-label={t('common.close')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <img src={result.dataUrl} alt="" className="capture-sheet-preview" />

        <p className="capture-sheet-hint">{t('ar.photoSaveHint')}</p>

        <div className="capture-sheet-actions">
          {typeof navigator.share === 'function' && (
            <button type="button" onClick={handleShare} className="btn btn-primary flex-1">
              <Share2 className="w-4 h-4" />
              {t('ar.sharePhoto')}
            </button>
          )}
          <button type="button" onClick={handleDownload} className="btn btn-secondary flex-1">
            <Download className="w-4 h-4" />
            {t('ar.downloadPhoto')}
          </button>
        </div>
      </div>
    </div>
  );
}
