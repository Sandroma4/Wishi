import styles from "./page.module.css";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { getMyWishlists } from "@/app/actions/wishlist";
import { getTranslations } from "next-intl/server";
import { ListLifecycle } from "@/components/wishlist/ListLifecycle";

export default async function WishlistsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const requested = (await searchParams).view;
  const view =
    requested === "archived" || requested === "trash" ? requested : "active";
  const wishlists = await getMyWishlists(view);
  const lifecycle = await getTranslations("listLifecycle");
  const t = await getTranslations("dashboard");
  const tw = await getTranslations("wishlist");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{t("myWishlists")}</h2>
        <Link href="/dashboard/wishlists/create">
          <Button>{t("newWishlist")}</Button>
        </Link>
      </div>

      <nav className="button-row" aria-label={lifecycle("views")}>
        {(["active", "archived", "trash"] as const).map((state) => (
          <Link
            key={state}
            aria-current={view === state ? "page" : undefined}
            href={`/dashboard/wishlists?view=${state}`}
          >
            {lifecycle(state + "Tab")}
          </Link>
        ))}
      </nav>
      {view !== "active" && (
        <p>{lifecycle(view === "trash" ? "trashHelp" : "archiveHelp")}</p>
      )}
      {wishlists.length === 0 ? (
        <Card className={styles.emptyCard}>
          <CardContent className={styles.emptyContent}>
            <p>{tw("empty")}</p>
            <Link href="/dashboard/wishlists/create">
              <Button variant="secondary" className={styles.createBtn}>
                {tw("createFirst")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className={styles.grid}>
          {wishlists.map((list) => (
            <Card key={list.id} className={styles.wishlistCard}>
              <CardHeader>
                <CardTitle>{list.name}</CardTitle>
                <CardDescription>
                  {tw(
                    `visibility${list.visibility.charAt(0) + list.visibility.slice(1).toLowerCase()}`,
                  )}{" "}
                  • {tw("itemsCount", { count: list._count.items })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className={styles.description}>{list.description || "—"}</p>
              </CardContent>
              <CardFooter>
                {view !== "trash" && (
                  <Link
                    href={`/dashboard/wishlists/${list.id}`}
                    className={styles.fullWidth}
                  >
                    <Button variant="secondary" fullWidth>
                      {tw("viewList")}
                    </Button>
                  </Link>
                )}
              </CardFooter>
              <CardContent>
                <ListLifecycle id={list.id} name={list.name} state={view} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
