import { BACKEND_URL } from "./utils";

export async function proxy(
  path: string,
  init: RequestInit,
): Promise<Response> {
  const url = `${BACKEND_URL}${path}`;
  try {
    const res = await fetch(url, init);
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
