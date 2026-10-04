import { getFamilyWishlists } from "@/app/actions/wishlist";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export async function FamilyWishlists({ familyId }: { familyId: string }) {
  const wishlists = await getFamilyWishlists(familyId);
  const t = await getTranslations("family");

  if (wishlists.length === 0) return null;

  return (
    <div style={{ marginTop: "2rem" }}>
      <h4
        style={{
          marginBottom: "1rem",
          fontSize: "1.125rem",
          fontWeight: "600",
        }}
      >
        {t("familyWishlists")}
      </h4>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "1rem",
        }}
      >
        {wishlists.map((wishlist) => (
          <Link
            href={`/dashboard/wishlists/${wishlist.id}`}
            key={wishlist.id}
            style={{ textDecoration: "none" }}
          >
            <Card
              style={{
                height: "100%",
                transition: "border-color 0.2s ease",
                cursor: "pointer",
              }}
              className="hover-border-primary"
            >
              <CardHeader style={{ paddingBottom: "0.5rem" }}>
                <CardTitle style={{ fontSize: "1rem" }}>
                  {wishlist.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--muted-foreground)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {t("byMember", {
                    name: wishlist.owner.name || t("roleMember"),
                  })}
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.25rem 0.5rem",
                    backgroundColor: "var(--secondary)",
                    borderRadius: "99px",
                    display: "inline-block",
                  }}
                >
                  {wishlist._count.items} {t("items")}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
