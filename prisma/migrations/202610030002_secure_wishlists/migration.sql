-- AlterTable
ALTER TABLE "Wishlist" ADD COLUMN "shareToken" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WishlistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "priceCents" INTEGER,
    "currency" TEXT DEFAULT 'EUR',
    "image" TEXT,
    "categoryId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "quantityDesired" INTEGER NOT NULL DEFAULT 1,
    "wishlistId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WishlistItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WishlistItem_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "Wishlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WishlistItem" ("priceCents", "categoryId", "createdAt", "currency", "description", "id", "image", "priority", "quantityDesired", "title", "updatedAt", "url", "wishlistId") SELECT CASE WHEN "price" IS NULL THEN NULL ELSE CAST(ROUND("price" * 100) AS INTEGER) END, "categoryId", "createdAt", "currency", "description", "id", "image", "priority", "quantityDesired", "title", "updatedAt", "url", "wishlistId" FROM "WishlistItem";
DROP TABLE "WishlistItem";
ALTER TABLE "new_WishlistItem" RENAME TO "WishlistItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_shareToken_key" ON "Wishlist"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_itemId_key" ON "Reservation"("itemId");
