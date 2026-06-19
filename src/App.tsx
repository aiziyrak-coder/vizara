import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from './lib/i18n-context';
import { AuthProvider } from './lib/auth-context';
import { ToastProvider } from './lib/toast-context';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardLayout } from './components/DashboardLayout';
import { GuestRoute } from './components/GuestRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Models } from './pages/Models';
import { Experiences } from './pages/Experiences';
import { Billing } from './pages/Billing';
import { Settings } from './pages/Settings';
import { PublicAR } from './pages/PublicAR';
import { PublicTour } from './pages/PublicTour';
import { Tours } from './pages/Tours';
import { TourEditor } from './pages/TourEditor';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="/ar/:orgSlug/:expSlug" element={<PublicAR />} />
            <Route path="/tour/:orgSlug/:tourSlug" element={<PublicTour />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="models" element={<Models />} />
              <Route path="experiences" element={<Experiences />} />
              <Route path="tours" element={<Tours />} />
              <Route path="tours/:tourId" element={<TourEditor />} />
              <Route path="billing" element={<Billing />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
    </I18nProvider>
    </ErrorBoundary>
  );
}
