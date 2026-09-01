const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

type AnalyticsEventType = 'BUILDER_STARTED' | 'TIMETABLE_GENERATED' | 'PDF_GENERATED';

// Prevent duplicate BUILDER_STARTED events per browser session by caching in memory
let builderStartedFired = false;

// Simple throttle for generation events to prevent spamming from rapid clicking
let lastGenerationTime = 0;

export function getAnonymousVisitorId(): string {
  let id = localStorage.getItem('anonymous_visitor_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('anonymous_visitor_id', id);
  }
  return id;
}

export function trackEvent(eventType: AnalyticsEventType, metadata: Record<string, any> = {}) {
  // 1. Client-side deduplication guards
  if (eventType === 'BUILDER_STARTED') {
    if (builderStartedFired) return;
    builderStartedFired = true;
  }
  
  if (eventType === 'TIMETABLE_GENERATED' || eventType === 'PDF_GENERATED') {
    const now = Date.now();
    if (now - lastGenerationTime < 2000) {
      // Ignore if another generation happened within 2 seconds
      return; 
    }
    lastGenerationTime = now;
  }

  // 2. Fetch the anonymous persistent ID
  const sessionId = getAnonymousVisitorId();

  // 3. Fire-and-forget payload (non-blocking)
  const payload = {
    anonymous_session_id: sessionId,
    event_type: eventType,
    metadata
  };

  fetch(`${API_URL}/api/analytics/events/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }).catch((err) => {
    // Silently catch network errors to ensure the builder continues to work seamlessly
    console.debug("[Analytics] Failed to send event, ignoring.", err);
  });
}
