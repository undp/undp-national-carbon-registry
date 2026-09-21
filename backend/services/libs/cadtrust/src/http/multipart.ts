/**
 * Multipart body construction for the file-upload endpoints:
 *
 *   POST /v2/organizations           field "file"   (JSON org definition)
 *   PUT  /v2/organizations/edit      field "file"
 *   POST /v2/project/batch           field "csv"
 *   POST /v2/unit/batch              field "csv"
 *   PUT  /v2/project/xlsx            field "xlsx"
 *   PUT  /v2/unit/xlsx               field "xlsx"
 *   POST /v2/offer/accept/import     field "file"
 *
 * No `form-data` dependency: the Docker base image is node:20-alpine, which ships
 * the spec-compliant global `FormData` and `Blob`, and axios has streamed those
 * natively in Node since 1.3.0 (this repo has 1.6.0).
 */

/** A file to upload. `content` is raw bytes — this package never touches the filesystem. */
export interface FileUpload {
  filename: string;
  content: Buffer | Uint8Array;
  /** Defaults are inferred from the extension when omitted. */
  contentType?: string;
}

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  csv: 'text/csv',
  json: 'application/json',
  txt: 'text/plain',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function inferContentType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() ?? '';
  return CONTENT_TYPE_BY_EXTENSION[extension] ?? 'application/octet-stream';
}

/**
 * Builds a `FormData` carrying exactly one file under `fieldName`.
 *
 * The caller must NOT set a Content-Type header alongside this — the boundary is
 * generated here and only the transport knows it. `request.ts` handles that.
 */
export function buildMultipart(fieldName: string, file: FileUpload): FormData {
  const form = new FormData();
  const bytes =
    file.content instanceof Uint8Array ? file.content : new Uint8Array(file.content as ArrayBufferLike);

  form.append(
    fieldName,
    new Blob([bytes], { type: file.contentType ?? inferContentType(file.filename) }),
    file.filename,
  );

  return form;
}

/**
 * Pulls the server-suggested filename out of a `Content-Disposition` header, so
 * XLSX-export and offer-file callers can honour it. Returns undefined when the
 * header is absent or unparseable rather than inventing a name.
 */
export function filenameFromContentDisposition(header?: string): string | undefined {
  if (!header) {
    return undefined;
  }
  const encoded = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header);
  if (encoded?.[1]) {
    try {
      return decodeURIComponent(encoded[1].trim().replace(/^"|"$/g, ''));
    } catch {
      // Fall through to the plain form below.
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain?.[1]?.trim();
}
