import AuthForm from "@/components/auth-form";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 transition-colors duration-500">
      <AuthForm mode="signup" />
    </main>
  );
}
