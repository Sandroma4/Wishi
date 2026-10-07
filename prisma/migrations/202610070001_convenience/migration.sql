CREATE TABLE "Recipient" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "ownerId" TEXT NOT NULL, CONSTRAINT "Recipient_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE INDEX "Recipient_ownerId_idx" ON "Recipient"("ownerId");
ALTER TABLE "Wishlist" ADD COLUMN "recipientId" TEXT REFERENCES "Recipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WishlistItem" ADD COLUMN "alternativeUrls" TEXT NOT NULL DEFAULT '';
