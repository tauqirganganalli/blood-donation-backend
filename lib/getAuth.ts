import { verifyToken } from "@/lib/auth";

export function getAuth(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return verifyToken(header.slice(7));
}