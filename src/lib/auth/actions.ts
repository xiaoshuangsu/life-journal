"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
  /** "success" messages (green) vs "error" messages (red) */
  success?: boolean;
};

/**
 * Login with email + password.
 * On success, redirects to /dashboard.
 */
export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const supabase = await createClient();

  const credentials = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Basic validation
  const errors: AuthFormState["errors"] = {};
  if (!credentials.email) errors.email = ["Email is required"];
  if (!credentials.password) errors.password = ["Password is required"];
  if (Object.keys(errors).length > 0) return { errors };

  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/home");
}

/**
 * Sign up with email + password.
 * If email confirmation is enabled in Supabase, shows a success message.
 * If disabled (MVP mode), auto-signs-in and redirects to /dashboard.
 */
export async function signup(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const supabase = await createClient();

  const credentials = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Basic validation
  const errors: AuthFormState["errors"] = {};
  if (!credentials.email) errors.email = ["Email is required"];
  if (!credentials.password) {
    errors.password = ["Password is required"];
  } else if (credentials.password.length < 8) {
    errors.password = ["Password must be at least 8 characters"];
  }
  if (Object.keys(errors).length > 0) return { errors };

  const { data, error } = await supabase.auth.signUp(credentials);

  if (error) {
    return { message: error.message };
  }

  // If email confirmation is enabled, no session is returned —
  // show a success message instead of redirecting.
  if (!data.session) {
    return {
      success: true,
      message:
        "Account created! Check your email for a confirmation link.",
    };
  }

  // Email confirmation is disabled — auto-sign-in + redirect
  revalidatePath("/", "layout");
  redirect("/home");
}

/**
 * Log out — ends the session and redirects to /login.
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
