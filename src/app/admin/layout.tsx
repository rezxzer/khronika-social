import { notFound } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/server";
import { isAdminServer } from "@/lib/admin-server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminServer(user.id)) {
    notFound();
  }

  return <>{children}</>;
}
