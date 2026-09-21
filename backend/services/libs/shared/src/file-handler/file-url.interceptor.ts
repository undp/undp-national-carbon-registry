import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, from, mergeMap } from "rxjs";
import { FileHandlerInterface } from "./filehandler.interface";
import { isStorageKey } from "./storage-key";

/**
 * Turns the storage keys held in the database into URLs the browser can fetch.
 *
 * It walks whole responses rather than being applied per endpoint because this
 * backend has no serialization layer - endpoints return TypeORM entities and raw
 * jsonb directly - so file references surface in nested `json_agg` results and
 * inside untyped columns where no decorator could reach them.
 *
 * Only strings under a known upload prefix are touched, so legacy absolute URLs
 * pass through untouched.
 */
@Injectable()
export class FileUrlInterceptor implements NestInterceptor {
  constructor(private readonly fileHandler: FileHandlerInterface) {}

  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(mergeMap((data) => from(this.resolveAll(data))));
  }

  private async resolveAll(
    node: any,
    seen: WeakSet<object> = new WeakSet()
  ): Promise<any> {
    if (typeof node === "string") {
      return isStorageKey(node) ? this.fileHandler.getUrl(node) : node;
    }

    if (
      node === null ||
      typeof node !== "object" ||
      node instanceof Date ||
      Buffer.isBuffer(node)
    ) {
      return node;
    }

    // Entities carry relations back to their parents; without this a circular
    // graph would recurse forever.
    if (seen.has(node)) {
      return node;
    }
    seen.add(node);

    // Only descend into values that can hold a key; awaiting every primitive
    // would allocate a promise per field on large list responses.
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (typeof value === "string") {
        if (isStorageKey(value)) {
          node[key] = await this.fileHandler.getUrl(value);
        }
      } else if (value !== null && typeof value === "object") {
        node[key] = await this.resolveAll(value, seen);
      }
    }
    return node;
  }
}
