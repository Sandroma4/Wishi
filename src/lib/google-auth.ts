export function googleAuthEnabled(
  env: Record<string, string | undefined> = process.env,
) {
  return Boolean(env.AUTH_GOOGLE_ID?.trim() && env.AUTH_GOOGLE_SECRET?.trim());
}
export function googleProfileAllowed(profile: unknown): boolean {
  if (!profile || typeof profile !== "object") return false;
  return (
    "email_verified" in profile &&
    profile.email_verified === true &&
    "email" in profile &&
    typeof profile.email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)
  );
}
