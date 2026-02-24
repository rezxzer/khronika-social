import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { runOrchestrationCycle } from "@/lib/video-pipeline/worker";
import type { VideoProcessingStatus } from "@/lib/video-pipeline/types";

interface DispatchParams {
  admin: SupabaseClient;
  assetId: string;
  trigger: "create" | "retry" | "manual";
  preferredFromStatus: VideoProcessingStatus;
  reason?: string | null;
}

export async function dispatchVideoAssetJob(
  params: DispatchParams,
): Promise<void> {
  const dispatchId = randomUUID();
  await runOrchestrationCycle({
    admin: params.admin,
    assetId: params.assetId,
    preferredFromStatus: params.preferredFromStatus,
    context: {
      trigger: params.trigger,
      reason: params.reason ?? null,
      dispatchId,
    },
  });
}
