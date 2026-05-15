import { NextResponse } from "next/server";
import { createProductImages } from "@/lib/services/image-service";
import type { ProductImageRequest } from "@/types/image";

export async function POST(request: Request) {
  const body = (await request.json()) as ProductImageRequest;
  const data = await createProductImages(body);
  return NextResponse.json(data);
}
