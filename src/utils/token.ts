"use server";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";

export async function getToken() {
  const cookieStore = await cookies();
  const token = (await cookieStore).get("access_token")?.value;
  return token;
}

export async function deleteToken() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  console.log("Token deleted.");
}

export async function checkAuthStatus() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return false;

  try {
    const decodedToken = jwt.decode(token) as JwtPayload;
    if (
      decodedToken &&
      decodedToken.exp &&
      decodedToken.exp * 1000 > Date.now()
    ) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
}
