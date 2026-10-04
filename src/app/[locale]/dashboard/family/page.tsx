import { OccasionIcon } from "@/components/ui/OccasionIcon";
import { auth } from "@/auth";
import styles from "./page.module.css";
import { getMyFamilies } from "@/app/actions/family";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { CreateFamilyForm } from "@/components/family/CreateFamilyForm";
import { InviteMemberForm } from "@/components/family/InviteMemberForm";
import { PendingInvitations } from "@/components/family/PendingInvitations";
import { MemberManagement } from "@/components/family/MemberManagement";
import { FamilyWishlists } from "@/components/family/FamilyWishlists";
import { getTranslations } from "next-intl/server";

export default async function FamilyPage() {
  const [families, t, session, flow, management] = await Promise.all([
    getMyFamilies(),
    getTranslations("family"),
    auth(),
    getTranslations("dailyFlow"),
    getTranslations("familyManagement"),
  ]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("title")}</h1>
      </header>

      <div className={styles.grid}>
        <div className={styles.mainContent}>
          {families.length === 0 ? (
            <Card className={styles.emptyCard}>
              <CardContent className={styles.emptyContent}>
                <div className="empty-art">
                  <OccasionIcon kind="people" />
                </div>
                <p>{t("noFamily")}</p>
                <p>{flow("emptyFamily")}</p>
                <a className="primary-link" href="#create-family-form">
                  {t("createFamily")}
                </a>
              </CardContent>
            </Card>
          ) : (
            families.map((family) => (
              <Card key={family.id} className={styles.familyCard}>
                <CardHeader>
                  <CardTitle>{family.name}</CardTitle>
                  <CardDescription>
                    {t("membersCount", { count: family.members.length })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {family.description && (
                    <p className={styles.description}>{family.description}</p>
                  )}

                  <div className={styles.membersList}>
                    <h4 className={styles.sectionTitle}>{t("members")}</h4>
                    <ul className={styles.list}>
                      {family.members.map((member) => (
                        <li key={member.id} className={styles.memberItem}>
                          <div className={styles.avatar}>
                            {member.user.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className={styles.memberName}>
                              {member.user.name}
                            </p>
                            <p className={styles.memberRole}>
                              {t(
                                member.role === "ADMIN"
                                  ? "roleAdmin"
                                  : "roleMember",
                              )}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {family.members.some(
                    (member) =>
                      member.userId === session?.user?.id &&
                      member.role === "ADMIN",
                  ) && (
                    <details className="form-options">
                      <summary>{t("invite")}</summary>
                      <div className="stack">
                        <InviteMemberForm familyId={family.id} />
                        <PendingInvitations familyId={family.id} />
                      </div>
                    </details>
                  )}

                  <FamilyWishlists familyId={family.id} />
                  {session?.user?.id && (
                    <details className="form-options">
                      <summary>{management("title")}</summary>
                      <MemberManagement
                        familyId={family.id}
                        ownerId={family.ownerId}
                        userId={session.user.id}
                        members={family.members}
                      />
                    </details>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className={styles.sideContent}>
          <details
            className="form-options creation-panel"
            open={!families.length}
          >
            <summary>{t("createFamily")}</summary>
            <CreateFamilyForm showTitle={false} />
          </details>
        </div>
      </div>
    </div>
  );
}
