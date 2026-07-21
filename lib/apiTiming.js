function normaliseMetricName(value) {
  return String(value || "api")
    .toLowerCase()
    .replace(/[^a-z0-9_\-.]+/g, "_")
    .slice(0, 60) || "api";
}

export async function timedRoute(metricName, handler) {
  const startedAt = performance.now();
  const response = await handler();
  const durationMs = Number((performance.now() - startedAt).toFixed(1));
  const token = normaliseMetricName(metricName);

  if (response?.headers?.set) {
    response.headers.set("Server-Timing", `${token};dur=${durationMs}`);
    response.headers.set("X-Route-Duration-Ms", String(durationMs));
  }

  if (durationMs >= 500) {
    console.warn(`[api-timing] ${token} took ${durationMs}ms`);
  }

  return response;
}
