import { NextResponse } from "next/server";

/** ponytail: phase 4 stub — Go/shell execution deferred to Docker runner */
export async function POST() {
  return NextResponse.json(
    {
      error: "Server-side runners (Go, shell) are not enabled yet.",
      phase: 4,
      hint: "Use browser runtimes (Sandpack, Pyodide) for v1 lessons.",
    },
    { status: 501 }
  );
}
