// actions/createUser.ts
"use server";

import { createUser } from "@/services/authService";
export async function handleCreateUser(formData: FormData) {
  const rawFormData = {
    email: formData.get("email") as string,
    role: formData.get("role") as string,
  };

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(rawFormData.email)) {
    return { error: "Please enter a valid email address." };
  }

  try {
    const response = await createUser(rawFormData);

    if (response.error) {
      return { error: response.error };
    }

    return {
      success: `Successfully created ${rawFormData.role} account for ${rawFormData.email}`,
      shouldRedirect: true,
    };
  } catch (err) {
    console.error("Submission error:", err);
    return { error: "An error occurred. Please try again." };
  }
}
