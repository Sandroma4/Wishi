import { googleAuthEnabled } from "@/lib/google-auth";
import { AuthForm } from "@/components/auth/AuthForm";
import { returnPath } from "@/lib/return-path";
export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    next?: string;
    passwordChanged?: string;
    oauthError?: string;
  }>;
}) {
  const { locale } = await params;
  const { next, passwordChanged, oauthError } = await searchParams;
  return (
    <AuthForm
      next={returnPath(next, locale)}
      googleEnabled={googleAuthEnabled()}
      oauthError={
        oauthError === "link" ||
        oauthError === "denied" ||
        oauthError === "failed"
          ? oauthError
          : undefined
      }
      passwordChanged={passwordChanged === "1"}
    />
  );
}
