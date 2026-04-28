function Face({ s, c, tr, o }: { s: number; c: string; tr: string; o: number }) {
  return (
    <div
      style={{
        position: "absolute",
        width: s,
        height: s,
        background: c,
        opacity: o,
        transform: tr,
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.15)",
        backfaceVisibility: "hidden",
      }}
    />
  );
}

export function Cube({ size, color }: { size: number; color: string }) {
  const h = size / 2;
  return (
    <div style={{ width: size, height: size, transformStyle: "preserve-3d" }}>
      <Face s={size} c={color} tr={`rotateY(0deg) translateZ(${h}px)`} o={0.9} />
      <Face s={size} c={color} tr={`rotateY(180deg) translateZ(${h}px)`} o={0.7} />
      <Face s={size} c={color} tr={`rotateY(90deg) translateZ(${h}px)`} o={0.8} />
      <Face s={size} c={color} tr={`rotateY(-90deg) translateZ(${h}px)`} o={0.6} />
      <Face s={size} c={color} tr={`rotateX(90deg) translateZ(${h}px)`} o={0.75} />
      <Face s={size} c={color} tr={`rotateX(-90deg) translateZ(${h}px)`} o={0.85} />
    </div>
  );
}

export function Octa({ size, color }: { size: number; color: string }) {
  return (
    <div style={{ width: size, height: size, transformStyle: "preserve-3d" }}>
      {[0, 90, 180, 270].map((r, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            borderLeft: `${size / 2}px solid transparent`,
            borderRight: `${size / 2}px solid transparent`,
            borderBottom: `${size}px solid ${color}`,
            opacity: 0.6 + i * 0.1,
            transform: `rotateY(${r}deg) rotateX(30deg)`,
            transformOrigin: "center center",
          }}
        />
      ))}
    </div>
  );
}

export function Ring({ size, color }: { size: number; color: string }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `3px solid ${color}`,
        borderRadius: "50%",
        transformStyle: "preserve-3d",
        boxShadow: `0 0 15px ${color}44, inset 0 0 15px ${color}22`,
      }}
    />
  );
}