ALTER TABLE "Wishlist" ADD COLUMN "occasion" TEXT;
ALTER TABLE "Wishlist" ADD COLUMN "neededBy" TEXT;
ALTER TABLE "Wishlist" ADD COLUMN "preferences" TEXT;
ALTER TABLE "WishlistItem" ADD COLUMN "isGroupGift" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "Contribution" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "itemId" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "amountCents" INTEGER NOT NULL CHECK ("amountCents" > 0),
 "accessTokenHash" TEXT,
 "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" DATETIME NOT NULL,
 CONSTRAINT "Contribution_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "WishlistItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "Contribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Contribution_itemId_userId_key" ON "Contribution"("itemId", "userId");
CREATE INDEX "Contribution_userId_idx" ON "Contribution"("userId");
CREATE TABLE "Feedback" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "userId" TEXT NOT NULL,
 "category" TEXT NOT NULL,
 "message" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'OPEN',
 "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Feedback_userId_createdAt_idx" ON "Feedback"("userId", "createdAt");
