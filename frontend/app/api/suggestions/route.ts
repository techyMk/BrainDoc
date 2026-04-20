import { NextRequest } from "next/server";
import { proxy } from "@/lib/proxy";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const refresh = req.nextUrl.searchParams.get("refresh") === "1";
  const qs = refresh ? "?refresh=true" : "";
  return proxy(`/api/suggestions${qs}`, { method: "GET", cache: "no-store" });
}
