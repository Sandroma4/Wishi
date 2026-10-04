import { AuthForm } from "@/components/auth/AuthForm";
import { returnPath } from "@/lib/return-path";
export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; passwordChanged?: string }>;
}) {
  const { locale } = await params;
  const { next, passwordChanged } = await searchParams;
  return (
    <AuthForm
      next={returnPath(next, locale)}
      passwordChanged={passwordChanged === "1"}
    />
  );
}
