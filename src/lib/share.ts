import { toast } from "sonner";

function getBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL || "https://khronika.ge";
}

export async function shareOrCopy({
  title,
  text,
  path,
}: {
  title: string;
  text?: string;
  path: string;
}) {
  const url = `${getBaseUrl()}${path}?ref=share`;

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.success("ლინკი დაკოპირდა");
  } catch {
    prompt("დააკოპირე ლინკი:", url);
  }
}
