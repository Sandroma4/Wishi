import styles from "./page.module.css";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { getTranslations } from "next-intl/server";

export default async function DashboardLoading() {
  const t = await getTranslations("dashboard");

  return (
    <div className={styles.grid}>
      {[t("upcomingEvents"), t("myWishlists"), t("familyActivity")].map(
        (title, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    style={{
                      paddingBottom: "0.5rem",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        height: "1.2rem",
                        backgroundColor: "var(--border)",
                        borderRadius: "4px",
                        width: "70%",
                        marginBottom: "0.5rem",
                        animation:
                          "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                      }}
                    ></div>
                    <div
                      style={{
                        height: "0.8rem",
                        backgroundColor: "var(--border)",
                        borderRadius: "4px",
                        width: "40%",
                        animation:
                          "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                      }}
                    ></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ),
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
}
