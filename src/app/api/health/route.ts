import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const results: Record<string, string> = {};

  // Check env vars
  results["SUPABASE_URL"] = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? "set"
    : "MISSING";
  results["SUPABASE_ANON_KEY"] = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? "set"
    : "MISSING";
  results["SUPABASE_SERVICE_ROLE_KEY"] = process.env
    .SUPABASE_SERVICE_ROLE_KEY
    ? "set"
    : "MISSING";
  results["DEEPSEEK_API_KEY"] = process.env.DEEPSEEK_API_KEY
    ? "set"
    : "MISSING";

  // Test Supabase connection
  try {
    const client = createServiceClient();
    const { data, error } = await client
      .from("entries")
      .select("count", { count: "exact", head: true });
    results["supabase_connection"] = error
      ? `ERROR: ${error.message}`
      : "OK";
  } catch (err) {
    results["supabase_connection"] =
      "EXCEPTION: " + (err instanceof Error ? err.message : String(err));
  }

  return NextResponse.json(results);
}
