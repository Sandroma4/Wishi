import { revalidatePath } from "next/cache";

export function refreshWishlists() {
  revalidatePath("/[locale]/dashboard", "layout");
  revalidatePath("/[locale]/share/[token]", "page");
  revalidatePath("/[locale]/lists/[id]", "page");
}
