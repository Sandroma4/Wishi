import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/" + (await getLocale()) + "/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, locale: true },
  });
  if (!user) notFound();
  return (
    <div className="stack focused-page">
      <ProfileForm
        key={JSON.stringify(user)}
        name={user.name || ""}
        email={user.email || ""}
        locale={user.locale || "fr"}
      />
      <ChangePasswordForm />
    </div>
  );
}
