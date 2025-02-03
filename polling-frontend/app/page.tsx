import { cookies } from "next/headers";
import { motion } from "framer-motion";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Page() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has("webauthn");

  if (isAuthenticated) {
    return redirect("/polls");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-8 max-w-2xl mx-auto"
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="inline-block"
        >
          <ChartBarIcon className="h-20 w-20 mx-auto text-blue-600" />
        </motion.div>

        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Real-Time Polling
        </h1>

        <p className="text-lg leading-8 text-gray-600">
          Create and participate in polls with real-time updates. Secure your
          account with passkey authentication.
        </p>

        <div className="flex items-center justify-center gap-6">
          {isAuthenticated ? (
            <Link href="/polls">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-primary text-lg"
              >
                View Polls
              </motion.button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-primary text-lg"
                >
                  Login
                </motion.button>
              </Link>

              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-secondary text-lg"
                >
                  Register
                </motion.button>
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
