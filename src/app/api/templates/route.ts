import { NextResponse } from "next/server";
import { listTemplates } from "@/lib/services/template-service";

export async function GET() {
  const data = await listTemplates();
  return NextResponse.json(data);
}
