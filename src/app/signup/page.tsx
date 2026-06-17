import AuthForm from "@/components/auth-form";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <AuthForm mode="signup" />
    </main>
  );
}
