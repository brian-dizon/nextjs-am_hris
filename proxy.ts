import { betterFetch } from "@better-fetch/fetch";
import { NextResponse, type NextRequest } from "next/server";
import type { Session } from "better-auth/types";

export default async function authMiddleware(request: NextRequest) {
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        // Get the cookie from the request
        cookie: request.headers.get("cookie") || "",
      },
    }
  );

  const isAuthPage = request.nextUrl.pathname.startsWith("/login") || 
                     request.nextUrl.pathname.startsWith("/setup");

  if (!session) {
    if (isAuthPage) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/setup"],
};
