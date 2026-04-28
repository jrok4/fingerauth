export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="mb-5 rounded-xl p-3 text-center text-xs font-medium"
      style={{
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.2)",
        color: "#f87171",
        animation: "slideUp 0.3s ease-out",
      }}
    >
      ⚠ {message}
    </div>
  );
}