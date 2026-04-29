import { BACKEND_URL } from "./utils";

const APP_API_KEY = process.env.APP_API_KEY ?? "";

export async function proxy(
  path: string,
  init: RequestInit,
): Promise<Response> {
  const url = `${BACKEND_URL}${path}`;
  const headers = new Headers(init.headers);
  if (APP_API_KEY) headers.set("X-API-Key", APP_API_KEY);
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
        detail: `Cannot reach backend at ${url}. ${msg}. Start it with "python main.py" in the backend/ folder.`,
      }),
      {
        status: 502,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
