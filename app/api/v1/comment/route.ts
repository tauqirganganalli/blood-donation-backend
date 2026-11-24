import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/getAuth";

const schema = z.object({ description: z.string().min(1) });

// POST /api/v1/comment?post_id=1
export async function POST(request: Request) {
  const auth = getAuth(request);
  if (!auth || auth.role !== "user" || !auth.userId) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const postId = Number(searchParams.get("post_id"));
  if (!Number.isInteger(postId)) {
    return NextResponse.json({ error: "post_id required" }, { status: 400 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "description required" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const comment = await prisma.comment.create({
    data: { postId, userId: auth.userId, description: parsed.data.description },
  });
  return NextResponse.json(comment, { status: 201 });
}