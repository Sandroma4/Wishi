import { PasswordRecoveryForm } from "@/components/auth/PasswordRecoveryForm";
export const metadata = { robots: { index: false, follow: false } };
export default function ForgotPasswordPage() {
  return <PasswordRecoveryForm />;
}
