import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

const schema = z.object({
  identifier: z.string().min(5),
  code: z.string().length(6),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "identifier and 6-digit code required" }, { status: 400 });
  }

  const { identifier, code } = parsed.data;

  const otp = await prisma.otp.findFirst({
    where: { identifier, code, verified: false, expiresAt: { gt: new Date() } },
    orderBy: { id: "desc" },
  });
  if (!otp) {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
  }

  await prisma.otp.update({ where: { id: otp.id }, data: { verified: true } });

  const user = await prisma.user.findFirst({
    where: { OR: [{ mobile: identifier }, { email: identifier }] },
  });
  if (!user) {
    return NextResponse.json({ error: "User not registered" }, { status: 404 });
  }

  const token = signToken({ userId: user.id, role: "user" });
  return NextResponse.json({ token });
}