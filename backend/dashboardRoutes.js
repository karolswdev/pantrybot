const express = require('express');
const authMiddleware = require('./authMiddleware');
const { households, household_members, inventoryItems } = require('./db');

const router = express.Router();

// GET /api/v1/dashboard/stats
router.get('/stats', authMiddleware, (req, res) => {
  try {
    const userId = req.userId;

    // Get user's households
    const userMemberships = household_members.filter(m => m.userId === userId);
    const userHouseholdIds = userMemberships.map(m => m.householdId);
    const userHouseholds = households.filter(h => userHouseholdIds.includes(h.id));

    // Calculate stats
    let totalItems = 0;
    let expiringInWeek = 0;
    let expiredItems = 0;
    let lowStockItems = 0;
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Calculate inventory stats for all user's households
    userHouseholdIds.forEach(householdId => {
      const items = inventoryItems.filter(item => item.householdId === householdId);
      totalItems += items.length;

      items.forEach(item => {
        if (item.expirationDate) {
          const expDate = new Date(item.expirationDate);
          if (expDate < now) {
            expiredItems++;
          } else if (expDate <= weekFromNow) {
            expiringInWeek++;
          }
        }
        
        // Consider items with quantity <= 1 as low stock
        if (item.quantity <= 1) {
          lowStockItems++;
        }
      });
    });

    // Calculate recent activity (mock data for now)
    const recentActivity = {
      itemsAddedToday: Math.floor(Math.random() * 5),
      itemsConsumedToday: Math.floor(Math.random() * 3),
      itemsWastedThisWeek: Math.floor(Math.random() * 2)
    };

    // Calculate waste metrics (mock data)
    const wasteMetrics = {
      totalWastedThisMonth: Math.floor(Math.random() * 10),
      wasteReductionPercent: Math.floor(Math.random() * 30),
      mostWastedCategory: 'Dairy'
    };

    res.status(200).json({
      households: userHouseholds.length,
      totalItems,
      expiringInWeek,
      expiredItems,
      lowStockItems,
      recentActivity,
      wasteMetrics,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve dashboard statistics'
    });
  }
});

// GET /api/v1/dashboard/notifications
router.get('/notifications', authMiddleware, (req, res) => {
  try {
    const userId = req.userId;

    // Mock notifications
    const notifications = [
      {
        id: '1',
        type: 'expiring_soon',
        title: 'Items Expiring Soon',
        message: '3 items will expire in the next 3 days',
        createdAt: new Date().toISOString(),
        read: false
      },
      {
        id: '2',
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: 'Milk is running low',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        read: true
      }
    ];

    res.status(200).json({
      notifications,
      unreadCount: notifications.filter(n => !n.read).length
    });
  } catch (error) {
    console.error('Dashboard notifications error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve notifications'
    });
  }
});

module.exports = router;