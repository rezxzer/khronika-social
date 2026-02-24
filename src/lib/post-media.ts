export type NormalizedMediaKind = "none" | "image" | "video";

const VALID_MEDIA_KINDS = new Set<NormalizedMediaKind>(["none", "image", "video"]);

type MediaLike = {
  media_urls?: unknown;
  media_kind?: unknown;
  video_url?: unknown;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toVideoUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveMediaKind(input: {
  mediaKind?: unknown;
  mediaUrls: string[];
  videoUrl: string | null;
}): NormalizedMediaKind {
  const hasImages = input.mediaUrls.length > 0;
  const hasVideo = !!input.videoUrl;
  const rawKind = VALID_MEDIA_KINDS.has(input.mediaKind as NormalizedMediaKind)
    ? (input.mediaKind as NormalizedMediaKind)
    : undefined;

  if (rawKind === "video") return hasVideo ? "video" : hasImages ? "image" : "none";
  if (rawKind === "image") return hasImages ? "image" : hasVideo ? "video" : "none";
  if (rawKind === "none") return hasVideo ? "video" : hasImages ? "image" : "none";

  if (hasVideo) return "video";
  if (hasImages) return "image";
  return "none";
}

export function normalizePostMedia<T extends MediaLike>(
  post: T,
): Omit<T, "media_urls" | "media_kind" | "video_url"> & {
  media_urls: string[];
  media_kind: NormalizedMediaKind;
  video_url: string | null;
} {
  const mediaUrls = toStringArray(post.media_urls);
  const videoUrl = toVideoUrl(post.video_url);
  const mediaKind = resolveMediaKind({
    mediaKind: post.media_kind,
    mediaUrls,
    videoUrl,
  });

  return {
    ...post,
    media_urls: mediaUrls,
    media_kind: mediaKind,
    video_url: videoUrl,
  };
}

export function pickPrimaryPosterUrl(input: {
  media_kind: NormalizedMediaKind;
  media_urls: string[];
  video_url: string | null;
}): string | null {
  if (input.media_kind !== "video" || !input.video_url) return null;
  const [firstImage] = input.media_urls;
  return typeof firstImage === "string" && firstImage.length > 0
    ? firstImage
    : null;
}
