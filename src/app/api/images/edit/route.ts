import { NextResponse } from "next/server";
import { editImage } from "@/lib/services/image-service";
import type { EditImageRequest } from "@/types/image";

export async function POST(request: Request) {
  const body = (await request.json()) as EditImageRequest;
  const data = await editImage(body);
  return NextResponse.json(data);
}
