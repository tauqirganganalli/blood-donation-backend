import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/getAuth";

const BLOOD = ["A_POS", "A_NEG", "B_POS", "B_NEG", "O_POS", "O_NEG"] as const;

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  mobile: z.string().min(10).optional(),
  bloodRequired: z.array(z.enum(BLOOD)).min(1).optional(),
  expiryTime: z.coerce.date().optional(),
});

async function findOwnPost(request: Request, idText: string) {
  const auth = getAuth(request);
  if (!auth || auth.role !== "user" || !auth.userId) {
    return { error: NextResponse.json({ error: "Login required" }, { status: 401 }) };
  }
  const id = Number(idText);
  if (!Number.isInteger(id)) {
    return { error: NextResponse.json({ error: "Invalid id" }, { status: 400 }) };
  }
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return { error: NextResponse.json({ error: "Post not found" }, { status: 404 }) };
  }
  if (post.userId !== auth.userId) {
    return { error: NextResponse.json({ error: "Not your post" }, { status: 403 }) };
  }
  return { post };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const found = await findOwnPost(request, id);
  if (found.error) return found.error;

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { bloodRequired, ...rest } = parsed.data;
  const updated = await prisma.post.update({
    where: { id: found.post!.id },
    data: {
      ...rest,
      ...(bloodRequired
        ? {
            bloodRequired: {
              deleteMany: {},
              create: bloodRequired.map((bloodGroup) => ({ bloodGroup })),
            },
          }
        : {}),
    },
    include: { bloodRequired: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const found = await findOwnPost(request, id);
  if (found.error) return found.error;

  await prisma.post.delete({ where: { id: found.post!.id } });
  return NextResponse.json({ deleted: found.post!.id });
}