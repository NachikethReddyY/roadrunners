import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "roadrunner",
    timestamp: new Date().toISOString(),
  });
}
