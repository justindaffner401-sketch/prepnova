import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// The glowing, gently distorting "nova" core + a faint wireframe shell.
function NovaCore() {
  const group = useRef();

  // Ease the whole group toward the pointer for a parallax/alive feel.
  useFrame((state, delta) => {
    if (!group.current) return;
    const px = state.pointer.x * 0.4;
    const py = state.pointer.y * 0.3;
    group.current.rotation.y += (px - group.current.rotation.y) * Math.min(1, delta * 2);
    group.current.rotation.x += (-py - group.current.rotation.x) * Math.min(1, delta * 2);
  });

  return (
    <group ref={group}>
      <Float
        speed={prefersReducedMotion ? 0 : 1.4}
        rotationIntensity={prefersReducedMotion ? 0 : 0.6}
        floatIntensity={prefersReducedMotion ? 0 : 1.1}
      >
        {/* Solid distorting core */}
        <mesh>
          <icosahedronGeometry args={[1.3, 16]} />
          <MeshDistortMaterial
            color="#2563eb"
            emissive="#0b1e6b"
            emissiveIntensity={0.5}
            roughness={0.12}
            metalness={0.65}
            distort={prefersReducedMotion ? 0.18 : 0.38}
            speed={prefersReducedMotion ? 0 : 1.7}
          />
        </mesh>
        {/* Cyan wireframe shell */}
        <mesh scale={1.34}>
          <icosahedronGeometry args={[1.3, 2]} />
          <meshBasicMaterial color="#67e8f9" wireframe transparent opacity={0.16} />
        </mesh>
      </Float>
    </group>
  );
}

export default function Hero3D() {
  return (
    <div className="relative h-[360px] w-full max-w-md sm:h-[440px]" aria-hidden="true">
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        frameloop={prefersReducedMotion ? "demand" : "always"}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 3, 4]} intensity={1.4} color="#bfdbfe" />
        <pointLight position={[-4, -2, -2]} intensity={3} color="#22d3ee" />
        <pointLight position={[3, -3, 2]} intensity={1.5} color="#60a5fa" />
        <Suspense fallback={null}>
          <NovaCore />
          {!prefersReducedMotion && (
            <Sparkles count={36} scale={7} size={2.4} speed={0.35} color="#93c5fd" opacity={0.5} />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
