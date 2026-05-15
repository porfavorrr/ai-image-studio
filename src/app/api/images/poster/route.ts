import { NextResponse } from "next/server";
import { createPosterImages } from "@/lib/services/image-service";
import type { PosterImageRequest } from "@/types/image";

export async function POST(request: Request) {
  const body = (await request.json()) as PosterImageRequest;
  const data = await createPosterImages(body);
  return NextResponse.json(data);
}
