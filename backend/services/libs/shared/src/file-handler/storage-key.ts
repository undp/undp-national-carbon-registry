/**
 * A storage key is the backend-neutral path a file is stored under, e.g.
 * "documents/exports/report.csv". Every adapter builds its URL from the same key,
 * which is what lets a stored reference survive a change of FILE_SERVICE.
 */

/**
 * Percent-encodes each path segment while leaving the separators intact.
 *
 * Encoding the whole key would escape the slashes too, and both the web app's
 * file-name parsing and S3's key lookup expect readable separators.
 */
export function encodeStorageKey(key: string): string {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/**
 * The prefixes every upload path is built under. Used to recognise a stored
 * reference in an outbound response, and to recover a key from a URL a client
 * echoed back.
 */
const STORAGE_KEY_PREFIXES = ["documents", "profile_images", "signatures"];

const KEY_PATTERN = new RegExp(`^(${STORAGE_KEY_PREFIXES.join("|")})/`);
// Anchored to a path separator so only a prefix appearing as its own path
// segment matches. Unanchored, an unrelated URL such as
// https://example.org/mydocuments/x.pdf would be mistaken for one of ours and
// silently re-pointed at our own storage.
const KEY_IN_URL_PATTERN = new RegExp(
  `(?:^|/)((${STORAGE_KEY_PREFIXES.join("|")})/.*)$`
);

/** True when the value is a bare storage key rather than an absolute URL. */
export function isStorageKey(value: string): boolean {
  return KEY_PATTERN.test(value);
}

/**
 * Turns a stored reference into a fetchable URL.
 *
 * `FileUrlInterceptor` does this for values travelling out over HTTP, but code
 * that consumes a stored reference server-side - email attachments, links
 * embedded in generated PDFs, values written into an export file - never passes
 * through the response pipeline and must resolve explicitly. Legacy absolute
 * URLs are returned unchanged.
 */
export async function resolveStoredFile(
  fileHandler: { getUrl(key: string): Promise<string> },
  value: string
): Promise<string> {
  if (!value || typeof value !== "string" || !isStorageKey(value)) {
    return value;
  }
  return fileHandler.getUrl(value);
}

/**
 * Recovers the storage key from a value a client sent back to us.
 *
 * The web app re-submits whatever it was shown for any file the user did not
 * re-pick, so what arrives is the resolved URL rather than the key we stored.
 * Without this, every form re-save would quietly replace a key with a
 * backend-specific URL and undo the indirection.
 *
 * Values that match nothing - notably legacy S3 URLs, whose keys are written
 * `profile_images%2F...` - are returned untouched, which keeps historic
 * references working exactly as they did.
 */
export function toStorageKey(value: string): string {
  if (!value || typeof value !== "string" || isStorageKey(value)) {
    return value;
  }
  const match = value.match(KEY_IN_URL_PATTERN);
  return match ? match[1] : value;
}
