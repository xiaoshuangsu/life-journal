import AuthForm from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 transition-colors duration-500">
      <AuthForm mode="login" />
    </main>
  );
}
