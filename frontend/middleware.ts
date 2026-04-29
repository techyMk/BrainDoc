import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublic = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/health",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublic(req)) return;

  const { userId } = await auth();
  if (!userId) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return new NextResponse(
        JSON.stringify({ detail: "Sign in to use this app." }),
        { status: 401, headers: { "content-type": "application/json" } },
      );
    }
    const signUp = new URL("/sign-up", req.url);
    signUp.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signUp);
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
