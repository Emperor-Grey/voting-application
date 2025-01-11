/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/app/_components/Button";
import { startAuthenticationFlow } from "@/app/lib/api";
import { useAuthStore } from "@/app/_store/store";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await startAuthenticationFlow(username);
      setAuthenticated(username);
      router.push("/polls");
    } catch (err) {
      console.error(err);

      setError((err as any).response?.data?.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen max-w-xl mx-auto flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-foreground">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium leading-6 text-foreground"
            >
              Username
            </label>
            <div className="mt-2">
              <Input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center border border-red-500 p-2">
              {error}
            </div>
          )}

          <Button type="submit" color="primary" isLoading={isLoading}>
            Sign in with Passkey
          </Button>
        </form>

        <p className="mt-10 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold leading-6 text-primary hover:text-primary/90"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
