import { proxy } from "@/lib/proxy";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  return proxy("/api/health", { method: "GET", cache: "no-store" });
}
