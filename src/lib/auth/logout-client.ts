import { signOut } from "@/lib/auth/session.functions";
import { clearAccessToken } from "@/lib/auth/token";

export async function logoutClient(): Promise<void> {
  clearAccessToken();
  await signOut();
}
