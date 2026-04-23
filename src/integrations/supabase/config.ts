// Single source of truth for Supabase public configuration.
// Used by both client and server to detect environment drift.
export const EXPECTED_PROJECT_REF = "mrvplahmthguvrauzwpy";
export const EXPECTED_SUPABASE_URL = `https://${EXPECTED_PROJECT_REF}.supabase.co`;
export const EXPECTED_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ydnBsYWhtdGhndXZyYXV6d3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NjI3OTYsImV4cCI6MjA5MjQzODc5Nn0.D4jRJ2zXY8qIGLBik0nhAR7uVzOKOVCoFFUKwWoMKuE";

// Build stamp generated at module-load time. The same source file produces a
// stable string per build, so server and client should report the same value
// when they come from the same deployment.
export const BUILD_STAMP =
  (typeof process !== "undefined" && process.env?.BUILD_STAMP) ||
  "2026-04-23T00:00:00Z";

export function extractProjectRef(url: string | undefined | null): string {
  if (!url) return "?";
  return url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "?";
}
