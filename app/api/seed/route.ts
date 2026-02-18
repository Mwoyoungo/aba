import { NextResponse } from "next/server";
import { seedBusinesses } from "@/lib/seed";

/**
 * GET /api/seed
 * Seeds sample businesses into Firestore.
 * ONLY available in development — blocked in production.
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not allowed in production." }, { status: 403 });
  }

  try {
    const result = await seedBusinesses();
    return NextResponse.json({
      success: true,
      message: `Seeded ${result.seeded} businesses into Firestore.`,
    });
  } catch (err) {
    console.error("[Seed Error]", err);
    return NextResponse.json({ error: "Seed failed. Check server logs." }, { status: 500 });
  }
}
