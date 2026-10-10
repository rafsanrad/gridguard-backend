import { prisma } from "../../lib/prisma";
import { deleteCache, getCache, setCache } from "../../utils/cache";

const DASHBOARD_CACHE_KEY = "analytics:dashboard";

const getDashboardAnalytics = async () => {
  const cachedData = await getCache(DASHBOARD_CACHE_KEY);

  if (cachedData) {
    return cachedData;
  }

  const [
    totalOutages,
    activeOutages,
    restoredOutages,
    totalSchedules,
    upcomingSchedules,
    totalServiceRequests,
    pendingServiceRequests,
    totalPayments,
    successfulPayments,
    paymentTotals,
    outageStatusCounts,
    serviceRequestStatusCounts,
  ] = await prisma.$transaction([
    prisma.outage.count({
      where: { deletedAt: null },
    }),
    prisma.outage.count({
      where: {
        deletedAt: null,
        status: {
          notIn: ["RESTORED", "CLOSED"],
        },
      },
    }),
    prisma.outage.count({
      where: {
        deletedAt: null,
        status: "RESTORED",
      },
    }),
    prisma.loadSheddingSchedule.count(),
    prisma.loadSheddingSchedule.count({
      where: {
        status: "SCHEDULED",
        startDateTime: { gte: new Date() },
      },
    }),
    prisma.serviceRequest.count(),
    prisma.serviceRequest.count({
      where: { status: "PENDING" },
    }),
    prisma.payment.count(),
    prisma.payment.count({
      where: { status: "SUCCESS" },
    }),
    prisma.payment.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
    }),
    prisma.outage.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.serviceRequest.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const result = {
    summary: {
      totalOutages,
      activeOutages,
      restoredOutages,
      totalSchedules,
      upcomingSchedules,
      totalServiceRequests,
      pendingServiceRequests,
      totalPayments,
      successfulPayments,
      totalRevenue: Number(paymentTotals._sum.amount ?? 0),
    },
    outagesByStatus: outageStatusCounts.map((item) => ({
      status: item.status,
      count: item._count._all,
    })),
    serviceRequestsByStatus: serviceRequestStatusCounts.map((item) => ({
      status: item.status,
      count: item._count._all,
    })),
  };

  await setCache(DASHBOARD_CACHE_KEY, result, 300);

  return result;
};

const invalidateDashboardCache = async () => {
  await deleteCache(DASHBOARD_CACHE_KEY);
};

export const AnalyticsService = {
  getDashboardAnalytics,
  invalidateDashboardCache,
};
