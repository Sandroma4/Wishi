ALTER TABLE "WishlistItem" ADD COLUMN "deletedAt" DATETIME;
CREATE INDEX "WishlistItem_wishlistId_deletedAt_idx" ON "WishlistItem"("wishlistId", "deletedAt");
