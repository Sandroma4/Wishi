const { PrismaClient } = require("@wishi/prisma-client");
const db = new PrismaClient();
async function main() {
  const [operation, id] = process.argv.slice(2);
  if (operation === "resolve" && id) {
    const result = await db.feedback.updateMany({
      where: { id, status: "OPEN" },
      data: { status: "RESOLVED" },
    });
    console.log({ resolved: result.count });
    return;
  }
  if (operation && operation !== "list")
    throw new Error("Usage: feedback.cjs list | resolve REPORT_ID");
  const reports = await db.feedback.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: { id: true, category: true, message: true, createdAt: true },
  });
  // Keep user text as JSON data; never execute report contents as commands.
  console.log(JSON.stringify(reports, null, 2));
}
main()
  .catch(() => {
    console.error("Impossible de consulter les signalements.");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
