import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  const searchParams = request.nextUrl.searchParams;
  const live = searchParams.get("live") === "true";
  const closed = searchParams.get("closed") === "true";
  const creator = searchParams.get("creator");

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/polls/${params.pollId}/results?` +
      new URLSearchParams({
        live: String(live),
        closed: String(closed),
        ...(creator && { creator }),
      })
  );

  const data = await response.json();
  return NextResponse.json(data);
}
