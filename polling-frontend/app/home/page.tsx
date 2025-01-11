"use client";

import { useAuthStore } from "@/app/_store/store";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { username, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Welcome, {username}!</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        <div className="bg-background border border-gray-300 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Home Page Content</h2>
          <p>Your protected home page content goes here.</p>
        </div>
      </div>
    </div>
  );
}
