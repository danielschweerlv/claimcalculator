import { StrictMode, useEffect, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import './index.css'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import { CanvasRevealEffect } from './components/ui/canvas-reveal-effect'

// Public pages (lazy loaded)
const App                 = lazy(() => import('./App.jsx'))
const CalculatorPage      = lazy(() => import('./pages/CalculatorPage.jsx'))
const HowItWorksPage      = lazy(() => import('./pages/HowItWorksPage.jsx'))
const InsuranceTacticsPage = lazy(() => import('./pages/InsuranceTacticsPage.jsx'))
const YourRightsPage      = lazy(() => import('./pages/YourRightsPage.jsx'))
const PrivacyPolicyPage   = lazy(() => import('./pages/PrivacyPolicyPage.jsx'))
const TermsOfServicePage  = lazy(() => import('./pages/TermsOfServicePage.jsx'))
const LegalNoticePage     = lazy(() => import('./pages/LegalNoticePage.jsx'))
const SuccessStoriesPage  = lazy(() => import('./pages/SuccessStoriesPage.jsx'))
const InjuryValuesPage    = lazy(() => import('./pages/InjuryValuesPage.jsx'))
const CaseGuidesPage      = lazy(() => import('./pages/CaseGuidesPage.jsx'))
const CaseGuideDetailPage = lazy(() => import('./pages/CaseGuideDetailPage.jsx'))

// Admin pages (lazy loaded)
const LoginFormPage = lazy(() => import('./components/auth/LoginForm.jsx').then(m => ({ default: m.LoginForm })))
const AdminDashboard = lazy(() => import('./components/admin/Dashboard.jsx').then(m => ({ default: m.Dashboard })))
const AdminLeadList = lazy(() => import('./components/admin/LeadList.jsx').then(m => ({ default: m.LeadList })))
const AdminLeadDetail = lazy(() => import('./components/admin/LeadDetail.jsx').then(m => ({ default: m.LeadDetail })))
const AdminAttorneyList = lazy(() => import('./components/admin/AttorneyList.jsx').then(m => ({ default: m.AttorneyList })))
const AdminPayoutList = lazy(() => import('./components/admin/PayoutList.jsx').then(m => ({ default: m.PayoutList })))
const AdminAnalytics = lazy(() => import('./components/admin/Analytics.jsx').then(m => ({ default: m.Analytics })))
const AdminLayoutModule = lazy(() => import('./components/admin/AdminLayout.jsx').then(m => ({ default: m.AdminLayout })))
const ProtectedRouteModule = lazy(() => import('./components/auth/ProtectedRoute.jsx').then(m => ({ default: m.ProtectedRoute })))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Wrapper to compose ProtectedRoute + AdminLayout (lazy)
function AdminShell({ children }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111318]" />}>
      <ProtectedRouteModule>
        <AdminLayoutModule>
          {children}
        </AdminLayoutModule>
      </ProtectedRouteModule>
    </Suspense>
  )
}

function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-[#111318] overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CanvasRevealEffect
          animationSpeed={3}
          containerClassName="bg-[#111318]"
          colors={[
            [0, 209, 255],
            [99, 102, 241],
          ]}
          dotSize={3}
          reverse={false}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0)_0%,_#111318_100%)] opacity-80 pointer-events-none" />
      </div>
      <ScrollToTop />
      <Header />
      <div className="flex-1">
        <Suspense fallback={<div className="min-h-screen bg-[#111318]" />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/insurance-tactics" element={<InsuranceTacticsPage />} />
          <Route path="/your-rights" element={<YourRightsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/legal-notice" element={<LegalNoticePage />} />
          <Route path="/success-stories" element={<SuccessStoriesPage />} />
          <Route path="/injury-values" element={<InjuryValuesPage />} />
          <Route path="/case-guides" element={<CaseGuidesPage />} />
          <Route path="/case-guides/:slug" element={<CaseGuideDetailPage />} />
        </Routes>
        </Suspense>
      </div>
      <Footer />
    </div>
  )
}

function Root() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  if (isAdmin) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#111318]" />}>
        <ScrollToTop />
        <Routes>
          <Route path="/admin/login" element={<LoginFormPage />} />
          <Route path="/admin" element={<AdminShell><AdminDashboard /></AdminShell>} />
          <Route path="/admin/leads" element={<AdminShell><AdminLeadList /></AdminShell>} />
          <Route path="/admin/leads/:id" element={<AdminShell><AdminLeadDetail /></AdminShell>} />
          <Route path="/admin/attorneys" element={<AdminShell><AdminAttorneyList /></AdminShell>} />
          <Route path="/admin/payouts" element={<AdminShell><AdminPayoutList /></AdminShell>} />
          <Route path="/admin/analytics" element={<AdminShell><AdminAnalytics /></AdminShell>} />
        </Routes>
      </Suspense>
    )
  }

  return <PublicLayout />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </StrictMode>,
)
