import { APIRequestContext, APIResponse, request } from "@playwright/test";
import { API_URL, USERS, UserKey } from "./auth";

export interface ApiClient {
  token: string;
  request: APIRequestContext;
  get: (path: string) => Promise<APIResponse>;
  post: (path: string, body?: unknown) => Promise<APIResponse>;
  put: (path: string, body?: unknown) => Promise<APIResponse>;
  delete: (path: string) => Promise<APIResponse>;
  json: <T = unknown>(res: APIResponse) => Promise<T>;
}

function joinUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const base = API_URL.replace(/\/+$/, "");
  const rel = path.replace(/^\/+/, "");
  return `${base}/${rel}`;
}

export async function createApiClient(
  user: UserKey | { email: string; password: string } = "dnaAdmin"
): Promise<ApiClient> {
  const creds = typeof user === "string" ? USERS[user] : user;
  const ctx = await request.newContext();
  const loginRes = await ctx.post(joinUrl("national/auth/login"), {
    data: { username: creds.email, password: creds.password },
  });
  if (!loginRes.ok()) {
    throw new Error(
      `Login failed for ${creds.email}: ${loginRes.status()} ${await loginRes.text()}`
    );
  }
  const body = await loginRes.json();
  const token: string = body?.access_token ?? body?.data?.access_token;
  if (!token) {
    throw new Error(
      `Login response missing access_token: ${JSON.stringify(body).slice(0, 500)}`
    );
  }
  const headers = { Authorization: `Bearer ${token}` };

  return {
    token,
    request: ctx,
    get: (path) => ctx.get(joinUrl(path), { headers }),
    post: (path, data) => ctx.post(joinUrl(path), { headers, data }),
    put: (path, data) => ctx.put(joinUrl(path), { headers, data }),
    delete: (path) => ctx.delete(joinUrl(path), { headers }),
    json: async (res) => {
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(
          `Non-JSON response (${res.status()}): ${text.slice(0, 500)}`
        );
      }
    },
  };
}

export async function expectOk(
  res: APIResponse,
  message = "expected 2xx response"
): Promise<void> {
  if (!res.ok()) {
    throw new Error(
      `${message}: got ${res.status()} ${res.statusText()} — ${await res.text()}`
    );
  }
}
