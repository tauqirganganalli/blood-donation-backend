import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";

export async function GET() {
  const token = signToken({ role: "guest" }, "1d");
  return NextResponse.json({ token });
}