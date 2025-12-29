-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "link" TEXT,
    "address" TEXT NOT NULL,
    "address2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'United States',
    "phone" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreSubmission" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "storeType" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "address" TEXT NOT NULL,
    "address2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'United States',
    "website" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedView" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedView_pkey" PRIMARY KEY ("id")
);

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
CREATE INDEX "SavedView_shop_idx" ON "SavedView"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "SavedView_shop_name_key" ON "SavedView"("shop", "name");

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
