import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      app: "ANTIKA",
      database: "connected",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        app: "ANTIKA",
        database: "disconnected",
      },
      { status: 503 },
    );
  }
}
