import type { Theme } from "@/themes";
import { Cube, Octa, Ring } from "@/components/Shapes";

const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  sz: Math.random() * 2 + 1,
  delay: Math.random() * 5,
  dur: Math.random() * 3 + 2,
}));

export function Background({ t }: { t: Theme }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {STARS.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.sz,
            height: s.sz,
            background:
              s.id % 3 === 0 ? t.primaryLight : s.id % 3 === 1 ? t.starAlt : "#fff",
            opacity: 0.3,
            animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
          }}
        />
      ))}

      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: 500,
          height: 500,
          backgroundImage: t.blob1,
          top: "10%",
          left: "10%",
          animation: "twinkle 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: 400,
          height: 400,
          backgroundImage: t.blob2,
          bottom: "10%",
          right: "10%",
          animation: "floatBlob 10s ease-in-out infinite",
        }}
      />

      <div className="absolute inset-0" style={{ perspective: 1000 }}>
        <div
          className="absolute"
          style={{ top: "12%", left: "8%", animation: "spin1 20s linear infinite" }}
        >
          <Cube size={40} color={t.cube1} />
        </div>
        <div
          className="absolute"
          style={{ bottom: "15%", right: "12%", animation: "spin2 25s linear infinite" }}
        >
          <Cube size={55} color={t.cube2} />
        </div>
        <div
          className="absolute"
          style={{ top: "20%", right: "18%", animation: "spin1 18s linear infinite" }}
        >
          <Octa size={45} color={t.octaColor} />
        </div>
        <div
          className="absolute"
          style={{
            bottom: "25%",
            left: "15%",
            animation: "floatBlob 6s ease-in-out infinite",
          }}
        >
          <Ring size={60} color={t.ring1} />
        </div>
        <div
          className="absolute"
          style={{ top: "65%", right: "25%", animation: "spin2 22s linear infinite" }}
        >
          <Ring size={35} color={t.ring2} />
        </div>
        <div
          className="absolute"
          style={{ top: "45%", left: "5%", animation: "spin1 15s linear infinite" }}
        >
          <Cube size={25} color={t.smallCube} />
        </div>
      </div>

      <div className="absolute inset-0" style={{ perspective: 800 }}>
        <div
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            width: 300,
            height: 300,
            marginLeft: -150,
            marginTop: -150,
            border: t.orbitBorder,
            borderRadius: "50%",
            transform: "rotateX(70deg)",
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: 8,
              height: 8,
              background: t.orbitBg,
              boxShadow: t.orbitShadow,
              animation: "orbit 8s linear infinite",
              top: "50%",
              left: "50%",
              marginLeft: -4,
              marginTop: -4,
            }}
          />
        </div>
      </div>
    </div>
  );
}