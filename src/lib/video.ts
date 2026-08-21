/**
 * Extracts YouTube video ID from various YouTube URL formats.
 * Supported formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  try {
    const parsed = new URL(url.trim())
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '')

    if (hostname === 'youtube.com') {
      if (parsed.pathname === '/watch') {
        const v = parsed.searchParams.get('v')
        return v && /^[a-zA-Z0-9_-]{6,15}$/.test(v) ? v : null
      }
      const embedMatch = parsed.pathname.match(/^\/(?:embed|v|shorts)\/([a-zA-Z0-9_-]{6,15})/)
      if (embedMatch) {
        return embedMatch[1]
      }
    } else if (hostname === 'youtu.be') {
      const shortMatch = parsed.pathname.match(/^\/([a-zA-Z0-9_-]{6,15})/)
      if (shortMatch) {
        return shortMatch[1]
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Validates whether a URL is a valid Cloud-hosted video URL.
 * It must be a valid HTTP/HTTPS URL and must NOT be a YouTube URL.
 */
export function isValidCloudVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  try {
    const parsed = new URL(url.trim())
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false
    }
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '')
    // Cloud video URLs must NOT be YouTube URLs
    if (hostname === 'youtube.com' || hostname === 'youtu.be') {
      return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * Validates video content source and URL, returning structured info or an error message.
 */
export function validateVideoContent(
  source: 'YOUTUBE' | 'CLOUD' | string,
  url: string,
): { valid: boolean; videoId?: string; error?: string } {
  if (!source) {
    return { valid: false, error: 'Video source is required ("YOUTUBE" or "CLOUD")' }
  }

  const normalizedSource = source.toUpperCase()

  if (normalizedSource === 'YOUTUBE') {
    const videoId = extractYouTubeVideoId(url)
    if (!videoId) {
      return {
        valid: false,
        error:
          'Invalid YouTube URL. Supported formats: https://www.youtube.com/watch?v=VIDEO_ID, https://youtu.be/VIDEO_ID, https://www.youtube.com/embed/VIDEO_ID',
      }
    }
    return { valid: true, videoId }
  }

  if (normalizedSource === 'CLOUD') {
    if (extractYouTubeVideoId(url)) {
      return {
        valid: false,
        error: 'Cloud video source cannot be a YouTube URL. Use source: "YOUTUBE" instead.',
      }
    }
    if (!isValidCloudVideoUrl(url)) {
      return {
        valid: false,
        error: 'Invalid cloud video URL. Must be a valid HTTP or HTTPS cloud storage URL.',
      }
    }
    return { valid: true }
  }

  return {
    valid: false,
    error: `Invalid video source "${source}". Supported sources are "YOUTUBE" and "CLOUD".`,
  }
}
