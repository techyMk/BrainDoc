import { NextRequest } from "next/server";
import { proxy } from "@/lib/proxy";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return proxy("/api/ingest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
