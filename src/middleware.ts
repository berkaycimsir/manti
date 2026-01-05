import { type NextRequest, NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
	const sessionCookie = request.cookies.get("better-auth.session_token");
	if (!sessionCookie) {
		return NextResponse.redirect(new URL("/sign-in", request.url));
	}
	return NextResponse.next();
}

export const config = {
	// You can add your own route protection logic here
	// Make sure not to protect the root URL, as it would prevent users from accessing static Next.js files or Stack's /handler path
	matcher: ["/home/:path*"],
};
