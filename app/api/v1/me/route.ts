import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/getAuth";

export async function GET(request: Request) {
  const auth = getAuth(request);
  if (!auth) {
    return NextResponse.json({ error: "Token required" }, { status: 401 });
  }
  if (auth.role === "guest" || !auth.userId) {
    return NextResponse.json({ role: "guest" });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      name: true,
      dob: true,
      mobile: true,
      email: true,
      bloodGroup: true,
      privacyConsent: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ role: "user", ...user });
}