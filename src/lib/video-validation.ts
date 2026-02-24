const ALLOWED_VIDEO_MIMES = new Set(["video/mp4", "video/webm"]);
const MAX_VIDEO_MB = 50;

export const VIDEO_ACCEPT_ATTR = "video/mp4,video/webm";

export function validateVideoFile(file: File): string | null {
  if (!ALLOWED_VIDEO_MIMES.has(file.type)) {
    return "ვიდეო უნდა იყოს MP4 ან WebM ფორმატში";
  }

  const maxBytes = MAX_VIDEO_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return `ვიდეოს მაქსიმალური ზომა ${MAX_VIDEO_MB}MB-ია`;
  }

  return null;
}
