import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1),
  dob: z.coerce.date(),
  bloodGroup: z.enum([  "A_POS",
"A_NEG",
"B_POS",
"B_NEG",
"AB_POS",
"AB_NEG",
"O_POS",
"O_NEG"]),
  mobile: z.string().min(10),
  email: z.string().email(),
  privacyConsent: z.literal(true),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { mobile, email } = parsed.data;
  const exists = await prisma.user.findFirst({
    where: { OR: [{ mobile }, { email }] },
  });
  if (exists) {
    return NextResponse.json({ error: "User already registered" }, { status: 409 });
  }

  const user = await prisma.user.create({ data: parsed.data });
  const token = signToken({ userId: user.id, role: "user" });
  return NextResponse.json({ token }, { status: 201 });
}