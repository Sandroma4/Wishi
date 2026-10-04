import { PasswordRecoveryForm } from "@/components/auth/PasswordRecoveryForm";
import { validResetToken } from "@/lib/password-reset-service";
import { prisma } from "@/lib/prisma";
export const metadata = {
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};
export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <PasswordRecoveryForm
      token={token}
      valid={await validResetToken(prisma, token)}
    />
  );
}
