import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { AdditiveBlending, Color, DoubleSide } from "three";

// App-wide live 3D background: a brand-tinted black hole (event horizon +
// shader-driven accretion disk + soft glow halo) drifting in a deep starfield.
// Pure WebGL, GPU-friendly (no lights, mostly basic/shader materials, one disk
// mesh). Transparent canvas so the navy <html> canvas reads as deep space.
// Freezes under prefers-reduced-motion; pauses its loop when the tab is hidden.
const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// ---- Accretion disk: a flat annulus painted by a procedural plasma shader ----
const DISK_INNER = 1.35;
const DISK_OUTER = 3.4;

// Placement of the whole black hole — a smallish feature pushed to the upper
// area so it reads as distant and never sits as a void directly behind text.
const HOLE_POSITION = [1.5, 1.95, -1];
const HOLE_TILT = -0.62; // shallow enough that the accretion ring stays visible
const HOLE_SCALE = 0.46;

const diskVertex = /* glsl */ `
  varying float vRadius;
  varying float vAngle;
  void main() {
    vRadius = length(position.xy);
    vAngle = atan(position.y, position.x);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const diskFragment = /* glsl */ `
  precision highp float;
  varying float vRadius;
  varying float vAngle;
  uniform float uTime;
  uniform float uInner;
  uniform float uOuter;
  uniform vec3 uColorHot;
  uniform vec3 uColorMid;
  uniform vec3 uColorCool;

  void main() {
    float t = clamp((vRadius - uInner) / (uOuter - uInner), 0.0, 1.0); // 0 inner .. 1 outer
    // Hot near the event horizon, fading outward.
    float radial = pow(1.0 - t, 1.8);
    // Soft feather on the inner + outer edges so the ring has no hard line.
    float edge = smoothstep(0.0, 0.05, t) * smoothstep(1.0, 0.80, t);
    // Swirling plasma: broad arms + finer bands streaming around the disk.
    float arms  = 0.5 + 0.5 * sin(vAngle * 3.0 - uTime * 1.1 + vRadius * 4.0);
    float bands = 0.6 + 0.4 * sin(vAngle * 9.0 + uTime * 0.6 - vRadius * 9.0);
    // Relativistic-ish Doppler: one approaching side stays brighter.
    float doppler = 0.55 + 0.45 * cos(vAngle - uTime * 0.12);
    float intensity = radial * edge * (0.5 + 0.65 * arms * bands) * doppler;
    // Inner = white-hot cyan, mid = electric cyan, outer = electric blue/indigo.
    vec3 col = mix(uColorHot, uColorMid, smoothstep(0.0, 0.45, t));
    col = mix(col, uColorCool, smoothstep(0.40, 1.0, t));
    gl_FragColor = vec4(col * intensity * 2.3, intensity);
  }
`;

function AccretionDisk() {
  const matRef = useRef();
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uInner: { value: DISK_INNER },
      uOuter: { value: DISK_OUTER },
      uColorHot: { value: new Color("#eafcff") },
      uColorMid: { value: new Color("#22d3ee") },
      uColorCool: { value: new Color("#3b6dff") },
    }),
    []
  );

  useFrame((state) => {
    if (prefersReducedMotion || typeof document !== "undefined" && document.hidden) return;
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh>
      <ringGeometry args={[DISK_INNER, DISK_OUTER, 160, 1]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={diskVertex}
        fragmentShader={diskFragment}
        transparent
        depthWrite={false}
        side={DoubleSide}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}

// ---- Black hole: tilted disk around a dark event-horizon sphere ----
function BlackHole() {
  const group = useRef();

  useFrame((state, delta) => {
    if (!group.current) return;
    if (prefersReducedMotion || (typeof document !== "undefined" && document.hidden)) return;
    // Slow in-plane spin of the whole disk for extra life.
    group.current.rotation.z += delta * 0.04;
  });

  return (
    // Tilt so we view the disk at an angle (Interstellar-style).
    <group rotation={[HOLE_TILT, 0, 0]} position={HOLE_POSITION} scale={HOLE_SCALE}>
      <group ref={group}>
        <AccretionDisk />
      </group>
      {/* Event horizon — a true void that occludes stars behind it. */}
      <mesh>
        <sphereGeometry args={[DISK_INNER * 0.82, 48, 48]} />
        <meshBasicMaterial color="#04060f" />
      </mesh>
    </group>
  );
}

// ---- Soft glow halo behind the hole (fakes the lensed bloom) ----
const haloFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uColor;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.0, d);
    a = pow(a, 2.6);
    gl_FragColor = vec4(uColor * a, a * 0.9);
  }
`;
const haloVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function Halo() {
  const uniforms = useMemo(
    () => ({ uColor: { value: new Color("#1b4dd6") } }),
    []
  );
  // Camera-facing (stays in scene root, plane normal points at the camera).
  return (
    <mesh
      position={[HOLE_POSITION[0], HOLE_POSITION[1], HOLE_POSITION[2] - 0.4]}
      scale={DISK_OUTER * HOLE_SCALE * 2.9}
    >
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={haloVertex}
        fragmentShader={haloFragment}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}

// ---- Top-level scene: starfield + hole, with gentle pointer parallax ----
function Scene() {
  const group = useRef();

  useFrame((state, delta) => {
    if (!group.current) return;
    if (prefersReducedMotion || (typeof document !== "undefined" && document.hidden)) return;
    const px = state.pointer.x * 0.06;
    const py = state.pointer.y * 0.06;
    group.current.rotation.y += (px - group.current.rotation.y) * Math.min(1, delta * 1.2);
    group.current.rotation.x += (-py - group.current.rotation.x) * Math.min(1, delta * 1.2);
  });

  return (
    <>
      <Halo />
      <group ref={group}>
        <Stars
          radius={60}
          depth={40}
          count={prefersReducedMotion ? 1200 : 2600}
          factor={3.2}
          saturation={0}
          fade
          speed={prefersReducedMotion ? 0 : 0.5}
        />
        <BlackHole />
      </group>
    </>
  );
}

export default function SpaceBackground() {
  const wrapRef = useRef(null);

  // Inside a fixed, lazy-mounted parent, R3F can miss its initial measure and
  // stay at the default 300x150. Forcing a window resize makes R3F re-measure;
  // we fire a few staggered ones so at least one lands after its measure
  // listener is attached (timing varies with the lazy chunk + StrictMode), plus
  // a ResizeObserver to catch later viewport/orientation changes.
  useEffect(() => {
    const fire = () => window.dispatchEvent(new Event("resize"));
    const timers = [0, 80, 250, 600].map((ms) => setTimeout(fire, ms));
    let ro;
    if (wrapRef.current && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(fire);
      ro.observe(wrapRef.current);
    }
    return () => {
      timers.forEach(clearTimeout);
      ro?.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className="fixed inset-0 -z-10" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        frameloop={prefersReducedMotion ? "demand" : "always"}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
