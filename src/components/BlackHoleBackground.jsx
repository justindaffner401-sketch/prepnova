import { useEffect, useState } from "react";

// Full-bleed cinematic black-hole environment for the hero. A looping video
// (when present) sits at the very back; dark navy gradients + a vignette keep
// the headline readable; a faint grid and a starfield add depth above the video
// but below the page content. Honors prefers-reduced-motion: no video, and a
// richer static cosmic fallback.
//
// TODO (video asset): drop a seamless looping black-hole clip at BOTH paths to
// turn on the animated version — until then the layered CSS gradient/accretion
// fallback (see `.blackhole-bg` in src/index.css) renders on its own and is
// already animated:
//     public/videos/blackhole.webm   (preferred — smaller, VP9/AV1)
//     public/videos/blackhole.mp4    (fallback — H.264)
// Keep it dark and roughly centered-right so it reads behind the product card.
export default function BlackHoleBackground() {
  const [motionOk, setMotionOk] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setMotionOk(!mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  return (
    <div className="blackhole-bg" aria-hidden="true">
      {/* Video only when motion is allowed (also avoids the download otherwise). */}
      {motionOk && (
        <video
          className="blackhole-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/videos/blackhole.webm" type="video/webm" />
          <source src="/videos/blackhole.mp4" type="video/mp4" />
        </video>
      )}

      {/* Readability + depth layers, above the video, below the content. */}
      <div className="blackhole-overlay" />
      <div className="blackhole-grid" />
      <div className="blackhole-stars" />
    </div>
  );
}
