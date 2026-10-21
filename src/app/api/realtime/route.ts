import { NextResponse } from "next/server";
import { readDb } from "@/db/local-store";

export async function GET() {
  const db = readDb();
  return NextResponse.json({
    updatedAt: db.updatedAt,
  });
}
