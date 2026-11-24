import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/getAuth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuth(request);
  if (!auth || auth.role !== "user" || !auth.userId) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const { id: idText } = await params;
  const id = Number(idText);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }
  if (comment.userId !== auth.userId) {
    return NextResponse.json({ error: "Not your comment" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ deleted: id });
}