import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/getAuth";

const BLOOD = ["A_POS", "A_NEG", "B_POS", "B_NEG", "O_POS", "O_NEG"] as const;

// GET /api/v1/feed?q=Donor&bloodGroup=A_POS,O_POS&page=1&pagination=10
export async function GET(request: Request) {
  const auth = getAuth(request);
  if (!auth) {
    return NextResponse.json({ error: "Token required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const groups = (searchParams.get("bloodGroup") ?? "")
    .split(",")
    .filter((g): g is (typeof BLOOD)[number] => (BLOOD as readonly string[]).includes(g));
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const take = Math.min(50, Math.max(1, Number(searchParams.get("pagination") ?? 10)));
  const skip = (page - 1) * take;

  if (q === "Receiver") {
    // list donors (users) with the chosen blood groups, only if they gave consent
    const users = await prisma.user.findMany({
      where: {
        privacyConsent: true,
        ...(groups.length ? { bloodGroup: { in: groups } } : {}),
      },
      select: { id: true, name: true, bloodGroup: true, mobile: true },
      skip,
      take,
      orderBy: { id: "desc" },
    });
    return NextResponse.json(users);
  }

  if (q === "Donor") {
    // list patient posts that have not expired
    const posts = await prisma.post.findMany({
      where: {
        expiryTime: { gt: new Date() },
        ...(groups.length ? { bloodRequired: { some: { bloodGroup: { in: groups } } } } : {}),
      },
      include: { bloodRequired: true, comments: true },
      skip,
      take,
      orderBy: { datePosted: "desc" },
    });
    return NextResponse.json(posts);
  }

  return NextResponse.json({ error: "q must be Donor or Receiver" }, { status: 400 });
}

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  mobile: z.string().min(10),
  bloodRequired: z.array(z.enum(BLOOD)).min(1),
  expiryTime: z.coerce.date(),
});

export async function POST(request: Request) {
  const auth = getAuth(request);
  if (!auth || auth.role !== "user" || !auth.userId) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { bloodRequired, ...rest } = parsed.data;
  const post = await prisma.post.create({
    data: {
      ...rest,
      userId: auth.userId,
      bloodRequired: { create: bloodRequired.map((bloodGroup) => ({ bloodGroup })) },
    },
    include: { bloodRequired: true },
  });
  return NextResponse.json(post, { status: 201 });
}