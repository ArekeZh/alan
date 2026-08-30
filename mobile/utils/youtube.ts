export const LESSON_VIDEO_SEEK_SECONDS = 10;

export function parseYouTubeVideoId(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      return parsed.pathname.split('/').filter(Boolean)[0] ?? null;
    }

    const fromQuery = parsed.searchParams.get('v');
    if (fromQuery) {
      return fromQuery;
    }

    const parts = parsed.pathname.split('/').filter(Boolean);
    const embedIndex = parts.indexOf('embed');
    if (embedIndex >= 0) {
      return parts[embedIndex + 1] ?? null;
    }

    const shortsIndex = parts.indexOf('shorts');
    if (shortsIndex >= 0) {
      return parts[shortsIndex + 1] ?? null;
    }

    return null;
  } catch {
    return null;
  }
}
