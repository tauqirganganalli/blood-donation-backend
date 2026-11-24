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

  return NextResponse.json({ isRegistered: !!user });
}