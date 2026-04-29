import { NextRequest } from "next/server";
import { proxy } from "@/lib/proxy";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  return proxy("/api/upload", { method: "POST", body: form });
}
