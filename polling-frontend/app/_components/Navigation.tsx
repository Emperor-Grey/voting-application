"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/app/_store/store";

export function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated, username, logout } = useAuthStore();

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex">
            <Link href="/polls" className="text-xl font-bold">
              Polling App
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/polls/manage"
                  className={pathname === "/polls/manage" ? "text-primary" : ""}
                >
                  Manage Polls
                </Link>
                <Link
                  href="/polls/new"
                  className={pathname === "/polls/new" ? "text-primary" : ""}
                >
                  Create Poll
                </Link>
                <span className="text-muted-foreground">{username}</span>
                <button
                  onClick={logout}
                  className="text-red-500 hover:text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login">Login</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
