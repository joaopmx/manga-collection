import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile");
  }

  redirect(`/u/${session.user.id}`);
}
