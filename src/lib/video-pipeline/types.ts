export const VIDEO_PROCESSING_STATUSES = [
  "uploading",
  "queued",
  "processing",
  "ready",
  "failed",
  "retrying",
  "cancelled",
] as const;

export type VideoProcessingStatus = (typeof VIDEO_PROCESSING_STATUSES)[number];

export interface VideoAssetRecord {
  id: string;
  post_id: string;
  owner_id: string;
  status: VideoProcessingStatus;
  source_url: string;
  source_storage_path: string | null;
  provider: string;
  provider_job_id: string | null;
  provider_request_id: string | null;
  manifest_url: string | null;
  progressive_url: string | null;
  poster_url: string | null;
  thumbnail_url: string | null;
  duration_sec: number | null;
  width: number | null;
  height: number | null;
  bitrate_kbps: number | null;
  error_code: string | null;
  error_message: string | null;
  attempt_count: number;
  last_attempt_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type VideoPipelineErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_TOKEN"
  | "BAD_REQUEST"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_STATE"
  | "SERVER_MISCONFIGURED"
  | "INTERNAL_ERROR";

export interface VideoPipelineError {
  ok: false;
  code: VideoPipelineErrorCode;
  error: string;
  details?: string;
}

export interface VideoPipelineSuccess<T> {
  ok: true;
  data: T;
}

export type VideoPipelineResponse<T> =
  | VideoPipelineSuccess<T>
  | VideoPipelineError;
