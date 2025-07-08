"use server";

import {
  loginUser,
  forgotPassword,
  resetPasswordConfirm,
} from "@/services/authService";
import { redirect } from "next/navigation";

export async function handleLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const remember = formData.get("remember") === "on";

  if (!email || !password) {
    return {
      success: false,
      error: "Email and password are required",
    };
  }

  const result = await loginUser(email, password, remember);

  if (result.success) {
    // Redirect to dashboard on successful login
    redirect("/");
  }

  return result;
}

export async function handleForgotPassword(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return {
      success: false,
      error: "Email is required",
    };
  }

  return await forgotPassword(email);
}

export async function handleResetPassword(
  uid: string,
  token: string,
  formData: FormData,
) {
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!newPassword || !confirmPassword) {
    return {
      success: false,
      error: "Both password fields are required",
    };
  }

  return await resetPasswordConfirm(uid, token, newPassword, confirmPassword);
}
