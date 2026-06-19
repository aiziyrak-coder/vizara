import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  translations,
  LOCALE_STORAGE_KEY,
  isValidLocale,
  DEFAULT_LOCALE,
} from '../i18n';

function getErrorStrings() {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    const locale = stored && isValidLocale(stored) ? stored : DEFAULT_LOCALE;
    return translations[locale].errors;
  } catch {
    return translations[DEFAULT_LOCALE].errors;
  }
}

function getCommonHome() {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    const locale = stored && isValidLocale(stored) ? stored : DEFAULT_LOCALE;
    return translations[locale].common.home;
  } catch {
    return translations[DEFAULT_LOCALE].common.home;
  }
}

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  declare readonly props: Readonly<Props>;
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Vizara render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      const errors = getErrorStrings();
      const homeLabel = getCommonHome();

      return (
        <div className="min-h-app flex items-center justify-center p-4 bg-[#f8fafc] safe-top safe-bottom">
          <div className="card p-8 max-w-sm w-full text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h1 className="text-lg font-bold text-[#0f172a] mb-2">{errors.unexpected}</h1>
            <p className="text-sm text-[#64748b] mb-6">
              {errors.unexpectedDesc}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn btn-primary w-full"
              >
                {errors.reload}
              </button>
              <Link to="/" className="btn btn-secondary w-full">
                {homeLabel}
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
