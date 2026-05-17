"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "tgadmin2025";
const SESSION_COOKIE_NAME = "admin_session";

export async function login(password: string) {
  if (password === ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    // Setting a simple cookie to track authentication.
    // Secure flag is important, HttpOnly prevents XSS accessing it.
    cookieStore.set(SESSION_COOKIE_NAME, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    
    // Redirect to dashboard on successful login
    redirect("/admin");
  } else {
    return { success: false, error: "Λάθος κωδικός" };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/admin/login");
}

export async function isAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.has(SESSION_COOKIE_NAME);
}
