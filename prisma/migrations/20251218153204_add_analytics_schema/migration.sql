-- CreateTable
CREATE TABLE "StoreAnalyticsEvent" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "searchQuery" TEXT,
    "resultsCount" INTEGER,
    "radius" DOUBLE PRECISION,
    "radiusUnit" TEXT,
    "storeId" TEXT,
    "storeName" TEXT,
    "viewType" TEXT,
    "distanceFromUser" DOUBLE PRECISION,
    "rankInResults" INTEGER,
    "contactType" TEXT,
    "oldRadius" DOUBLE PRECISION,
    "newRadius" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreAnalyticsAggregate" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "totalSearches" INTEGER NOT NULL DEFAULT 0,
    "uniqueSessions" INTEGER NOT NULL DEFAULT 0,
    "topSearchQueries" JSONB,
    "topStores" JSONB,
    "totalContacts" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreAnalyticsAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreAnalyticsEvent_shop_idx" ON "StoreAnalyticsEvent"("shop");

-- CreateIndex
CREATE INDEX "StoreAnalyticsEvent_eventType_idx" ON "StoreAnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "StoreAnalyticsEvent_timestamp_idx" ON "StoreAnalyticsEvent"("timestamp");

-- CreateIndex
CREATE INDEX "StoreAnalyticsEvent_sessionId_idx" ON "StoreAnalyticsEvent"("sessionId");

-- CreateIndex
CREATE INDEX "StoreAnalyticsEvent_storeId_idx" ON "StoreAnalyticsEvent"("storeId");

-- CreateIndex
CREATE INDEX "StoreAnalyticsEvent_searchQuery_idx" ON "StoreAnalyticsEvent"("searchQuery");

-- CreateIndex
CREATE INDEX "StoreAnalyticsAggregate_shop_periodType_periodStart_idx" ON "StoreAnalyticsAggregate"("shop", "periodType", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "StoreAnalyticsAggregate_shop_periodType_periodStart_key" ON "StoreAnalyticsAggregate"("shop", "periodType", "periodStart");
