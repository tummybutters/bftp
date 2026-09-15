import { reviewRedirect } from "@/lib/review-redirect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ token: string }> };
export async function GET(request: Request, context: Context) {
  return reviewRedirect(request, (await context.params).token);
}
export async function HEAD(request: Request, context: Context) {
  return reviewRedirect(request, (await context.params).token);
}
