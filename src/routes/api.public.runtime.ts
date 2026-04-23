import { createFileRoute } from "@tanstack/react-router";
import { getRequestHost, getRequestHeader } from "@tanstack/react-start/server";
import {
  EXPECTED_PROJECT_REF,
  BUILD_STAMP,
  extractProjectRef,
} from "@/integrations/supabase/config";

export const Route = createFileRoute("/api/public/runtime")({
  server: {
    handlers: {
      GET: async () => {
        let host = "?";
        try {
          host = getRequestHost() || getRequestHeader("host") || "?";
        } catch {
          host = "?";
        }
        const hasUrl = !!process.env.SUPABASE_URL;
        const serverProjectRef = extractProjectRef(process.env.SUPABASE_URL);
        const hasService = !!(
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY
        );
        const hasPub = !!process.env.SUPABASE_PUBLISHABLE_KEY;
        const envComplete = hasUrl && hasService && hasPub;
        const missingEnv: string[] = [];
        if (!hasUrl) missingEnv.push("SUPABASE_URL");
        if (!hasPub) missingEnv.push("SUPABASE_PUBLISHABLE_KEY");
        if (!hasService) missingEnv.push("SUPABASE_SERVICE_ROLE_KEY");
        return Response.json(
          {
            host,
            buildStamp: BUILD_STAMP,
            serverProjectRef,
            expectedProjectRef: EXPECTED_PROJECT_REF,
            projectMismatch:
              serverProjectRef !== "?" &&
              serverProjectRef !== EXPECTED_PROJECT_REF,
            hasSupabaseUrl: hasUrl,
            hasServiceKey: hasService,
            hasPublishableKey: hasPub,
            envComplete,
            missingEnv,
            timestamp: new Date().toISOString(),
          },
          { headers: { "cache-control": "no-store" } }
        );
      },
    },
  },
});
