import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AuroraBackground from "./components/AuroraBackground.jsx";
import Navbar from "./components/Navbar.jsx";
import { useFocusMode } from "./lib/focusMode.js";

// Heavy three.js scene — code-split so it never blocks first paint.
const SpaceBackground = lazy(() => import("./components/SpaceBackground.jsx"));
import Landing from "./pages/Landing.jsx";
import SubjectSelect from "./pages/SubjectSelect.jsx";
import Practice from "./pages/Practice.jsx";
import Exam from "./pages/Exam.jsx";
import Progress from "./pages/Progress.jsx";
import Account from "./pages/Account.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  // During an active timed test the 3D scene unmounts so nothing moves behind
  // the questions (the faint aurora stays as a calm base).
  const focusMode = useFocusMode();

  return (
    <div className="min-h-screen">
      {/* Layered background: faint aurora nebula (-z-20) behind the live
          3D starfield + black hole (-z-10), over the navy <html> canvas. */}
      <AuroraBackground />
      {!focusMode && (
        <Suspense fallback={null}>
          <SpaceBackground />
        </Suspense>
      )}
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/select" element={<SubjectSelect />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/exam" element={<Exam />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/account" element={<Account />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
