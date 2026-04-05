"use client";

// ── Client-side analytics tracker ────────────────────────────────────────────
// Fires events to /api/analytics — no-op in test mode.

import { TEST_MODE } from "@/lib/test-mode";

let sessionId: string | null = null;

function getSessionId(): string {
  if (sessionId) return sessionId;
  if (typeof window !== "undefined") {
    const stored = sessionStorage.getItem("dlb_session");
    if (stored) { sessionId = stored; return stored; }
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem("dlb_session", id);
    sessionId = id;
    return id;
  }
  return "ssr";
}

export type EventType =
  | "page_view"
  | "product_view"
  | "filter_apply"
  | "lookbook_complete";

export async function trackEvent(
  tenantId: string,
  lookbookId: string,
  eventType: EventType,
  productId?: string,
  metadata?: Record<string, unknown>
) {
  if (TEST_MODE) return;
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id:   tenantId,
        lookbook_id: lookbookId,
        event_type:  eventType,
        product_id:  productId ?? null,
        session_id:  getSessionId(),
        metadata:    metadata ?? {},
      }),
      keepalive: true,
    });
  } catch {
    // Silently swallow — analytics must never break the UX
  }
}
