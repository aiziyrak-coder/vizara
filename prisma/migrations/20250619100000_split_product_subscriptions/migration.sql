-- Split subscriptions into per-product (VizaraAR + VizaraTour)
PRAGMA foreign_keys=OFF;

CREATE TABLE "Subscription_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "product" TEXT NOT NULL DEFAULT 'vizara_ar',
    "planId" TEXT NOT NULL DEFAULT 'ar_starter',
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodEnd" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "Subscription_new" ("id", "organizationId", "product", "planId", "status", "stripeCustomerId", "stripeSubscriptionId", "currentPeriodEnd", "createdAt")
SELECT
    "id",
    "organizationId",
    'vizara_ar',
    CASE "planId"
        WHEN 'starter' THEN 'ar_starter'
        WHEN 'business' THEN 'ar_business'
        WHEN 'pro' THEN 'ar_pro'
        WHEN 'enterprise' THEN 'ar_enterprise'
        ELSE COALESCE("planId", 'ar_starter')
    END,
    "status",
    "stripeCustomerId",
    "stripeSubscriptionId",
    "currentPeriodEnd",
    "createdAt"
FROM "Subscription";

INSERT INTO "Subscription_new" ("id", "organizationId", "product", "planId", "status", "stripeCustomerId", "stripeSubscriptionId", "currentPeriodEnd", "createdAt")
SELECT
    "id" || '-tour',
    "organizationId",
    'vizara_tour',
    CASE "planId"
        WHEN 'business' THEN 'tour_business'
        WHEN 'pro' THEN 'tour_pro'
        WHEN 'enterprise' THEN 'tour_enterprise'
        ELSE 'tour_starter'
    END,
    "status",
    "stripeCustomerId",
    NULL,
    "currentPeriodEnd",
    "createdAt"
FROM "Subscription"
WHERE "planId" IN ('business', 'pro', 'enterprise')
  AND "status" IN ('active', 'trialing');

DROP TABLE "Subscription";
ALTER TABLE "Subscription_new" RENAME TO "Subscription";
CREATE UNIQUE INDEX "Subscription_organizationId_product_key" ON "Subscription"("organizationId", "product");

PRAGMA foreign_keys=ON;
