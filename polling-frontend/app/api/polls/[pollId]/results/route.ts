import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  const searchParams = request.nextUrl.searchParams;
  const live = searchParams.get("live") === "true";
  const closed = searchParams.get("closed") === "true";
  const creator = searchParams.get("creator");

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/polls/${
      (
        await params
      ).pollId
    }/results?` +
      new URLSearchParams({
        live: String(live),
        closed: String(closed),
        ...(creator && { creator }),
      })
  );

  const data = await response.json();
  return Response.json(data);
}
