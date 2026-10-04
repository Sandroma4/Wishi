CREATE INDEX "FamilyMember_familyId_idx" ON "FamilyMember"("familyId");
CREATE INDEX "Invitation_familyId_email_idx" ON "Invitation"("familyId", "email");
CREATE INDEX "Wishlist_ownerId_visibility_idx" ON "Wishlist"("ownerId", "visibility");
CREATE INDEX "Wishlist_eventId_idx" ON "Wishlist"("eventId");
CREATE INDEX "WishlistItem_wishlistId_idx" ON "WishlistItem"("wishlistId");
CREATE INDEX "Reservation_userId_idx" ON "Reservation"("userId");
CREATE INDEX "Event_familyId_date_idx" ON "Event"("familyId", "date");
