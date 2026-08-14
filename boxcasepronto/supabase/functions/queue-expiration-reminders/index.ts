import { json, requireAutomationSecret } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!requireAutomationSecret(request)) return json({ error: "Unauthorized" }, 401);

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("queue_expiration_reminders");
    if (error) throw error;
    return json({ queued: data ?? 0 });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
