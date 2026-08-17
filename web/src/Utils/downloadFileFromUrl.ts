/**
 * Saves a server-generated file to the user's device.
 *
 * Pointing an `<a download>` straight at the URL does not work here: the API
 * serves exports from `backendHost` (`:3000`) while the app runs on `:3030`, and
 * browsers **ignore the `download` attribute on a cross-origin href**. The
 * anchor then behaves like an ordinary link — the browser navigates to the file
 * and renders it inline (CSV) or hands it to a viewer tab (XLSX) instead of
 * saving it.
 *
 * Fetching the bytes first and handing the anchor a same-origin `blob:` URL
 * side-steps that entirely, and `download` is honoured again. This relies on the
 * export host sending `Access-Control-Allow-Origin` — the backend does, via
 * `enableCors()` in `src/server.ts`, which is registered ahead of the static
 * assets middleware so it covers `public/documents/exports` too.
 */
export async function downloadFileFromUrl(url: string, fileName: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed for ${fileName}: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);

  try {
    const anchor = document.createElement('a');
    anchor.style.display = 'none';
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    // Revoking the object URL - not the remote one, which is not ours to
    // revoke and would be a silent no-op.
    window.URL.revokeObjectURL(objectUrl);
  }
}
