import type { Theme } from "@/themes";
import { Cube } from "@/components/Shapes";

export function LogoCube({ t }: { t: Theme }) {
  return (
    <div className="flex justify-center mb-6">
      <div className="relative" style={{ width: 60, height: 60, perspective: 200 }}>
        <div
          style={{
            width: 60,
            height: 60,
            transformStyle: "preserve-3d",
            animation: "spin1 10s linear infinite",
          }}
        >
          <div className="absolute" style={{ top: 9, left: 9 }}>
            <Cube size={42} color={t.cubeColor} />
          </div>
        </div>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle,rgba(${t.primaryRgb},0.3),transparent 70%)`,
            filter: "blur(10px)",
          }}
        />
      </div>
    </div>
  );
}