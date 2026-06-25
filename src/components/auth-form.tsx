"use client";

import { useActionState } from "react";
import { login, signup, type AuthFormState } from "@/lib/auth/actions";

type AuthFormProps = {
  mode: "login" | "signup";
};

const initialState: AuthFormState = {};

export default function AuthForm({ mode }: AuthFormProps) {
  const action = mode === "login" ? login : signup;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="mx-auto flex w-full max-w-sm flex-col gap-4"
    >
      <h1 className="text-2xl font-semibold text-center text-zinc-800 dark:text-white">
        {mode === "login" ? "Welcome back" : "Create your journal"}
      </h1>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-800 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-500 focus:outline-none transition-colors"
        />
        {state?.errors?.email && (
          <p className="text-sm text-red-500">{state.errors.email[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="password"
          className="text-sm font-medium text-zinc-600 dark:text-zinc-300"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={
            mode === "login" ? "current-password" : "new-password"
          }
          placeholder="········"
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-800 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-500 focus:outline-none transition-colors"
        />
        {state?.errors?.password && (
          <p className="text-sm text-red-500">{state.errors.password[0]}</p>
        )}
      </div>

      {state?.message && (
        <div
          className={`rounded-lg border px-4 py-2.5 text-sm ${
            state.success
              ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
              : "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300"
          }`}
        >
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-zinc-800 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-black hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
      >
        {pending
          ? "Loading..."
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </button>

      <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
        {mode === "login" ? (
          <>
            No account?{" "}
            <a href="/signup" className="text-zinc-800 dark:text-white underline underline-offset-4">
              Sign up
            </a>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <a href="/login" className="text-zinc-800 dark:text-white underline underline-offset-4">
              Sign in
            </a>
          </>
        )}
      </p>
    </form>
  );
}
