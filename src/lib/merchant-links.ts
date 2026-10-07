import { readPublicResource } from "./product-preview";
export async function checkMerchantLink(
  url: string,
  read = readPublicResource,
): Promise<"available" | "missing" | "unknown"> {
  try {
    await read(url, 1024 * 1024, "html");
    return "available";
  } catch (error) {
    return [404, 410].includes((error as { status?: number }).status || 0)
      ? "missing"
      : "unknown";
  }
}
