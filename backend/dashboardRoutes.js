const express = require('express');
const authMiddleware = require('./authMiddleware');
const { householdRepository, inventoryRepository, activityLogRepository, notificationRepository, prisma } = require('./repositories');
const { logger } = require('./lib/logger');

const router = express.Router();

// GET /api/v1/dashboard/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's households
    const userHouseholds = await householdRepository.findUserHouseholds(userId);
    const householdIds = userHouseholds.map(h => h.id);

    if (householdIds.length === 0) {
      return res.status(200).json({
        households: 0,
        totalItems: 0,
        expiringInWeek: 0,
        expiredItems: 0,
        lowStockItems: 0,
        recentActivity: {
          itemsAddedToday: 0,
          itemsConsumedToday: 0,
          itemsWastedThisWeek: 0
        },
        wasteMetrics: {
          totalWastedThisMonth: 0,
          wasteReductionPercent: 0,
          mostWastedCategory: null
        },
        lastUpdated: new Date().toISOString()
      });
    }

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Aggregate inventory stats across all households
    const [totalItems, expiringInWeek, expiredItems, lowStockItems] = await Promise.all([
      prisma.inventoryItem.count({
        where: { householdId: { in: householdIds } }
      }),
      prisma.inventoryItem.count({
        where: {
          householdId: { in: householdIds },
          expirationDate: { gte: now, lte: weekFromNow }
        }
      }),
      prisma.inventoryItem.count({
        where: {
          householdId: { in: householdIds },
          expirationDate: { lt: now }
        }
      }),
      prisma.inventoryItem.count({
        where: {
          householdId: { in: householdIds },
          quantity: { lte: 1 }
        }
      })
    ]);

    // Recent activity from item history
    const [itemsAddedToday, itemsConsumedToday, itemsWastedThisWeek, totalWastedThisMonth] = await Promise.all([
      prisma.itemHistory.count({
        where: {
          householdId: { in: householdIds },
          action: 'created',
          timestamp: { gte: startOfToday }
        }
      }),
      prisma.itemHistory.count({
        where: {
          householdId: { in: householdIds },
          action: 'consumed',
          timestamp: { gte: startOfToday }
        }
      }),
      prisma.itemHistory.count({
        where: {
          householdId: { in: householdIds },
          action: 'wasted',
          timestamp: { gte: startOfWeek }
        }
      }),
      prisma.itemHistory.count({
        where: {
          householdId: { in: householdIds },
          action: 'wasted',
          timestamp: { gte: startOfMonth }
        }
      })
    ]);

    res.status(200).json({
      households: userHouseholds.length,
      totalItems,
      expiringInWeek,
      expiredItems,
      lowStockItems,
      recentActivity: {
        itemsAddedToday,
        itemsConsumedToday,
        itemsWastedThisWeek
      },
      wasteMetrics: {
        totalWastedThisMonth,
        wasteReductionPercent: 0, // Would need historical data to calculate
        mostWastedCategory: 'N/A'
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, userId: req.user?.id }, 'Failed to retrieve dashboard statistics');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve dashboard statistics'
    });
  }
});

// GET /api/v1/dashboard/notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get notifications from database
    const result = await notificationRepository.findUserNotifications(userId, {
      limit: 10,
      unreadOnly: false
    });

    const notifications = result.notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      createdAt: n.createdAt.toISOString(),
      read: !!n.readAt
    }));

    res.status(200).json({
      notifications,
      unreadCount: await notificationRepository.getUnreadCount(userId)
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, userId: req.user?.id }, 'Failed to retrieve dashboard notifications');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve notifications'
    });
  }
});

// GET /api/v1/households/:householdId/activity
// Activity feed for a household
router.get('/households/:householdId/activity', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { householdId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Check if user is a member of the household
    const membership = await householdRepository.getUserMembership(householdId, userId);
    if (!membership) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    // Get activity logs
    const result = await activityLogRepository.findByHousehold(householdId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      activities: result.activities.map(a => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        entityName: a.entityName,
        user: a.user ? {
          id: a.user.id,
          displayName: a.user.displayName
        } : null,
        timestamp: a.timestamp.toISOString(),
        metadata: a.metadata
      })),
      total: result.total,
      hasMore: result.hasMore
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.householdId, userId: req.user?.id }, 'Failed to retrieve activity feed');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve activity feed'
    });
  }
});

// GET /api/v1/households/:householdId/reports
// Reports for a household with real aggregated data
router.get('/households/:householdId/reports', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { householdId } = req.params;
    const days = parseInt(req.query.days) || 30;

    // Check if user is a member of the household
    const membership = await householdRepository.getUserMembership(householdId, userId);
    if (!membership) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Get waste data for current and previous periods
    const [currentWasted, previousWasted, currentConsumed] = await Promise.all([
      prisma.itemHistory.findMany({
        where: {
          householdId,
          action: 'wasted',
          timestamp: { gte: startDate }
        },
        include: {
          item: { select: { price: true, category: true } }
        }
      }),
      prisma.itemHistory.findMany({
        where: {
          householdId,
          action: 'wasted',
          timestamp: { gte: previousPeriodStart, lt: startDate }
        },
        include: {
          item: { select: { price: true, category: true } }
        }
      }),
      prisma.itemHistory.findMany({
        where: {
          householdId,
          action: 'consumed',
          timestamp: { gte: startDate }
        },
        include: {
          item: { select: { price: true, quantity: true } }
        }
      })
    ]);

    // Calculate waste value (sum of price * quantity wasted)
    const currentMonthWaste = currentWasted.reduce((sum, h) => {
      const price = h.item?.price ? Number(h.item.price) : 0;
      const qty = h.quantity || 1;
      return sum + (price * qty);
    }, 0);

    const previousMonthWaste = previousWasted.reduce((sum, h) => {
      const price = h.item?.price ? Number(h.item.price) : 0;
      const qty = h.quantity || 1;
      return sum + (price * qty);
    }, 0);

    const percentageChange = previousMonthWaste > 0
      ? Math.round(((currentMonthWaste - previousMonthWaste) / previousMonthWaste) * 100)
      : 0;

    // Weekly breakdown
    const weeklyData = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

      const weekValue = currentWasted
        .filter(h => {
          const ts = new Date(h.timestamp);
          return ts >= weekStart && ts < weekEnd;
        })
        .reduce((sum, h) => {
          const price = h.item?.price ? Number(h.item.price) : 0;
          const qty = h.quantity || 1;
          return sum + (price * qty);
        }, 0);

      weeklyData.unshift({
        week: `Week ${4 - i}`,
        value: Math.round(weekValue * 100) / 100
      });
    }

    // Category breakdown
    const categoryMap = new Map();
    currentWasted.forEach(h => {
      const category = h.item?.category || 'Uncategorized';
      const price = h.item?.price ? Number(h.item.price) : 0;
      const qty = h.quantity || 1;
      const value = price * qty;

      categoryMap.set(category, (categoryMap.get(category) || 0) + value);
    });

    const totalWasteValue = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, value]) => ({
        category,
        percentage: totalWasteValue > 0 ? Math.round((value / totalWasteValue) * 100) : 0,
        value: Math.round(value * 100) / 100
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Expiry patterns by day of week
    const dayMap = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
    const expiryByDay = [0, 0, 0, 0, 0, 0, 0];

    currentWasted.forEach(h => {
      if (h.reason === 'expired') {
        const day = new Date(h.timestamp).getDay();
        expiryByDay[day]++;
      }
    });

    const expiryPatterns = Object.entries(dayMap).map(([idx, dayOfWeek]) => ({
      dayOfWeek,
      count: expiryByDay[parseInt(idx)]
    }));

    // Current inventory value
    const inventoryValue = await prisma.inventoryItem.aggregate({
      where: { householdId },
      _sum: {
        price: true
      }
    });

    // Savings from consumed items
    const savingsFromConsumed = currentConsumed.reduce((sum, h) => {
      const price = h.item?.price ? Number(h.item.price) : 0;
      const qty = h.quantity || 1;
      return sum + (price * qty);
    }, 0);

    res.json({
      wasteTracking: {
        currentMonth: Math.round(currentMonthWaste * 100) / 100,
        previousMonth: Math.round(previousMonthWaste * 100) / 100,
        percentageChange,
        weeklyData
      },
      categoryBreakdown,
      expiryPatterns,
      inventoryValue: inventoryValue._sum.price ? Math.round(Number(inventoryValue._sum.price) * 100) / 100 : 0,
      totalItemsWasted: currentWasted.length,
      totalItemsConsumed: currentConsumed.length,
      savingsFromConsumed: Math.round(savingsFromConsumed * 100) / 100
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.householdId, userId: req.user?.id }, 'Failed to retrieve reports');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve reports'
    });
  }
});

module.exports = router;
