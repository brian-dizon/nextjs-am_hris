import { redirect } from "next/navigation";

export default function RootPage() {
  // Direct users straight into the authenticated ecosystem.
  // The 'proxy.ts' (middleware) will handle the redirect to /login if no session exists.
  redirect("/dashboard");
}
