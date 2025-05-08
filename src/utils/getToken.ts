"use server";
import { cookies } from "next/headers";

export async function getToken() {
  const cookieStore = await cookies();
  const token = (await cookieStore).get("access_token")?.value;
  return token;
}
