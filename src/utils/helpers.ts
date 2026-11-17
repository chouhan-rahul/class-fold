/**
 * Creates a debounced version of a function that delays execution until after
 * the specified wait time has elapsed since the last time it was invoked.
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  waitMs: number
): { (...args: Parameters<T>): void; cancel: () => void } {
  let timeoutId: NodeJS.Timeout | undefined;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      func(...args);
    }, waitMs);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  return debounced;
}

/**
 * Checks whether a given string appears to be an image source (data URI, image URL, or filename).
 */
export function isImageSource(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();

  // Base64 Data URI
  if (/^data:image\/[a-zA-Z0-9+.-]+;base64,/i.test(trimmed)) {
    return true;
  }

  // Common image extensions or image endpoints
  if (/\.(png|jpe?g|gif|webp|svg|avif|ico|bmp|tiff)(\?.*)?$/i.test(trimmed)) {
    return true;
  }

  // URLs from common image hosting / CDN patterns
  if (/^https?:\/\/.*(images?|img|photos?|assets?|static|avatar|gravatar|unsplash|cloudinary)/i.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Truncates a string to a given length, appending an ellipsis if trimmed.
 */
export function truncate(text: string, maxLength: number = 80): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 1) + '…';
}

/**
 * Parses individual class names from a raw class string.
 */
export function parseClassTokens(rawClasses: string): string[] {
  if (!rawClasses) {
    return [];
  }
  return rawClasses
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

/**
 * Safely compiles a regex pattern string into a RegExp object without throwing errors on user typos.
 */
export function safeRegex(pattern: string, flags = 'g'): RegExp | null {
  try {
    return new RegExp(pattern, flags);
  } catch (err) {
    console.warn(`[Class Fold] Invalid regular expression pattern "${pattern}":`, err);
    return null;
  }
}
