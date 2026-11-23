import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { getAnalyticsAdminContext } from "@/lib/adminAnalyticsAuth";
import { getKit } from "@/lib/intelligence/social";
import { buildSlide, loadAvatar, loadFonts, slideCount } from "@/app/intelligence/social/slides";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request, { params }) {
  const gate = await getAnalyticsAdminContext();
  if (!gate.ok) return new NextResponse(gate.error, { status: gate.status });

  const { slug, n } = await params;
  const kit = getKit(slug);
  const index = Number.parseInt(n, 10);
  if (!kit || !Number.isInteger(index) || index < 1 || index > slideCount(kit)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const fmt = new URL(request.url).searchParams.get("fmt") === "portrait" ? "portrait" : "square";
  const { element, width, height } = buildSlide(kit, index, fmt, await loadAvatar());

  // Satori errors surface inside the image stream as an empty response, so render to a buffer to report them.
  try {
    const image = new ImageResponse(element, { width, height, fonts: await loadFonts() });
    return new NextResponse(await image.arrayBuffer(), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    return new NextResponse(`Could not render slide: ${error?.message || error}`, { status: 500 });
  }
}
