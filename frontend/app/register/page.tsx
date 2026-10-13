"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import { register } from "@/lib/api";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await register(name.trim(), email.trim(), password);
      router.push(`/login?next=${encodeURIComponent(nextPath)}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create your account.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Start planning your next journey with TripPilot AI."
    >
      <form onSubmit={handleSubmit}>
        <label className="field" htmlFor="name">
          <span>Full name</span>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </label>

        <label className="field" htmlFor="email">
          <span>Email</span>
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
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </label>

        <label className="field" htmlFor="confirmPassword">
          <span>Confirm password</span>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Enter password again"
          />
        </label>

        {error && (
          <p role="alert" className="alert alert-error">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary btn-block">
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      <p className="lede" style={{ marginTop: 24 }}>
        Already have an account?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(nextPath)}`}
          className="text-link"
        >
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Create account" subtitle="Loading registration...">
          <div className="loading-card">Preparing sign-up...</div>
        </AuthLayout>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
