import { auth } from "@clerk/nextjs/server";
import { BACKEND_URL } from "./utils";

const APP_API_KEY = process.env.APP_API_KEY ?? "";

export async function proxy(
  path: string,
  init: RequestInit,
): Promise<Response> {
  const url = `${BACKEND_URL}${path}`;
  const headers = new Headers(init.headers);
  if (APP_API_KEY) headers.set("X-API-Key", APP_API_KEY);

  // Pass through the authenticated user's id. Clerk middleware has already
  // ensured the caller is signed in; we trust this only because the backend
  // also requires X-API-Key, which is a server-side secret.
  try {
    const { userId } = await auth();
    if (userId) headers.set("X-User-Id", userId);
  } catch {
    /* health check etc. — let backend respond anyway */
  }

  try {
    const res = await fetch(url, { ...init, headers });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({
        detail: `Cannot reach backend at ${url}. ${msg}.`,
      }),
      {
        status: 502,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
