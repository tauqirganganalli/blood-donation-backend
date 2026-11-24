import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

type TokenPayload = { userId?: number; role: "user" | "guest" };

export function signToken(payload: TokenPayload, expiresIn: string = "7d") {
  return jwt.sign(payload, SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as TokenPayload;
  } catch {
    return null;
  }
}