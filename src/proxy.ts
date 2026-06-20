import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/m(.*)",
]);

function isPublicMatchReadApi(pathname: string, method: string) {
  if (method !== "GET") return false;
  return (
    /^\/api\/matches\/[^/]+$/.test(pathname) ||
    /^\/api\/matches\/[^/]+\/engagement$/.test(pathname)
  );
}

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;
  if (isPublicMatchReadApi(req.nextUrl.pathname, req.method)) return;
  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
