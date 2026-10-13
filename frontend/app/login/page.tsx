"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import { login } from "@/lib/api";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      router.push(nextPath);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue planning your next trip."
    >
      <form onSubmit={handleSubmit}>
        <label className="field" htmlFor="email">
          <span>Email address</span>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <label className="field" htmlFor="password">
          <span>Password</span>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </label>

        {error && (
          <p role="alert" className="alert alert-error">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary btn-block">
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="lede" style={{ marginTop: 24 }}>
        Don&apos;t have an account?{" "}
        <Link
          href={`/register?next=${encodeURIComponent(nextPath)}`}
          className="text-link"
        >
          Create account
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Welcome back" subtitle="Loading sign-in...">
          <div className="loading-card">Preparing login...</div>
        </AuthLayout>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
