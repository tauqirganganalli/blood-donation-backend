import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ identifier: z.string().min(5) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "identifier required" }, { status: 400 });
  }

  const { identifier } = parsed.data;
  const user = await prisma.user.findFirst({
    where: { OR: [{ mobile: identifier }, { email: identifier }] },
  });
  if (!user) {
    return NextResponse.json({ error: "User not registered" }, { status: 404 });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await prisma.otp.create({
    data: {
      identifier,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  // Development only: real apps send this by SMS or email
  console.log(`OTP for ${identifier}: ${code}`);

  return NextResponse.json({ message: "OTP sent" });
}