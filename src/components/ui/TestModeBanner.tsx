export default function TestModeBanner() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: "#f59e0b",
        color: "#000",
        fontSize: ".75rem",
        fontWeight: 600,
        letterSpacing: ".05em",
        padding: ".375rem 1rem",
        borderRadius: "99px",
        boxShadow: "0 2px 12px rgba(0,0,0,.2)",
        pointerEvents: "none",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      ⚠ TEST MODE — no Supabase connected
    </div>
  );
}
