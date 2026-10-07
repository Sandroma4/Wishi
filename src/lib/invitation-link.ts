/** Extract only the invitation token; never navigate to a supplied host. */
export function invitationPath(input: string): string | null {
  const value = input.trim();
  if (/^[a-f0-9]{64}$/i.test(value)) return `/invite/${value}`;
  try {
    const url = new URL(value, "https://cadeoly.invalid");
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    const match = url.pathname.match(
      /^\/(?:fr\/|en\/)?invite\/([a-f0-9]{64})\/?$/i,
    );
    return match ? `/invite/${match[1]}` : null;
  } catch {
    return null;
  }
}
