import {
  type VideoProcessingStatus,
  VIDEO_PROCESSING_STATUSES,
} from "@/lib/video-pipeline/types";

const TRANSITIONS: Record<VideoProcessingStatus, VideoProcessingStatus[]> = {
  uploading: ["queued", "failed", "cancelled"],
  queued: ["processing", "failed", "cancelled", "retrying"],
  processing: ["ready", "failed", "retrying", "cancelled"],
  ready: [],
  failed: ["retrying", "cancelled"],
  retrying: ["queued", "processing", "failed", "cancelled"],
  cancelled: [],
};

const RETRY_REQUEST_ALLOWED: ReadonlySet<VideoProcessingStatus> = new Set([
  "failed",
]);

export function isVideoProcessingStatus(
  value: unknown,
): value is VideoProcessingStatus {
  return (
    typeof value === "string" &&
    (VIDEO_PROCESSING_STATUSES as readonly string[]).includes(value)
  );
}

export function canTransitionStatus(
  from: VideoProcessingStatus,
  to: VideoProcessingStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function isRetryAllowed(status: VideoProcessingStatus): boolean {
  return RETRY_REQUEST_ALLOWED.has(status);
}
