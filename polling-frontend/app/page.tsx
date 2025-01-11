import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has("webauthn");

  if (isAuthenticated) {
    return redirect("/polls");
  }

  return redirect("/login");
}
