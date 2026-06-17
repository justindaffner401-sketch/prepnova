import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AuroraBackground from "./components/AuroraBackground.jsx";
import CookieConsent from "./components/CookieConsent.jsx";
import ConsentedAnalytics from "./components/ConsentedAnalytics.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Landing from "./pages/Landing.jsx";
import SubjectSelect from "./pages/SubjectSelect.jsx";
import Practice from "./pages/Practice.jsx";
import Exam from "./pages/Exam.jsx";
import Progress from "./pages/Progress.jsx";
import Account from "./pages/Account.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Privacy from "./pages/Privacy.jsx";
import Terms from "./pages/Terms.jsx";

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen">
      {/* Keyboard users can jump straight past the nav to the page content. */}
      <a href="#main-content" className="skip-link">Skip to content</a>

      {/* Lightweight CSS aurora app-wide. The homepage hero has its own
          full-bleed cinematic video background (see Landing.jsx). We do NOT
          run a live WebGL scene app-wide — a continuous 60fps render loop on
          every page made the app feel slow/janky on most laptops. */}
      <AuroraBackground />
      {/* Cinematic film-grain texture over the whole UI (static, pointer-none). */}
      <div className="grain" aria-hidden="true" />
      <ScrollToTop />
      <Navbar />

      <div id="main-content" tabIndex={-1}>
        <ErrorBoundary key={pathname}>
          <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/select" element={<SubjectSelect />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/exam" element={<Exam />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/account" element={<Account />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </div>

      {/* Global footer so legal links (Privacy/Terms/Cookie settings) are
          reachable from every page, not just the homepage. */}
      <Footer />

      {/* Non-essential analytics loads only after cookie consent. */}
      <CookieConsent />
      <ConsentedAnalytics />
    </div>
  );
}
