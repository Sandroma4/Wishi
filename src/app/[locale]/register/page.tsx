import { googleAuthEnabled } from "@/lib/google-auth";
import { AuthForm } from "@/components/auth/AuthForm";
import { returnPath } from "@/lib/return-path";
export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const { next } = await searchParams;
  return (
    <AuthForm
      register
      next={returnPath(next, locale)}
      googleEnabled={googleAuthEnabled()}
    />
  );
}
