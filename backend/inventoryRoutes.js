const express = require('express');
const authenticateToken = require('./authMiddleware');
const { broadcastToHousehold } = require('./socket');
const { householdRepository, inventoryRepository, activityLogRepository } = require('./repositories');
const { logger } = require('./lib/logger');

const router = express.Router();

// Helper function to calculate days until expiration
function calculateDaysUntilExpiration(expirationDate) {
  if (!expirationDate) return null;

  const now = new Date();
  const expDate = new Date(expirationDate);
  const diffTime = expDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

// Helper function to determine expiration status
function getExpirationStatus(daysUntilExpiration) {
  if (daysUntilExpiration === null) return 'no_expiry';
  if (daysUntilExpiration < 0) return 'expired';
  if (daysUntilExpiration <= 3) return 'expiring_soon';
  return 'fresh';
}

// GET /api/v1/households/:householdId/items - List household items
router.get('/households/:householdId/items', authenticateToken, async (req, res) => {
  try {
    const { householdId } = req.params;
    const userId = req.user.id;
    const { search, location, status } = req.query;

    // Check if user is a member of the household
    const membership = await householdRepository.getUserMembership(householdId, userId);
    if (!membership) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a member of this household'
      });
    }

    // Get items with filters
    const filters = { search, location, status };
    const rawItems = await inventoryRepository.findByHousehold(householdId, filters);

    // Transform items with expiration info
    const items = rawItems.map(item => {
      const daysUntilExpiration = calculateDaysUntilExpiration(item.expirationDate);
      const expirationStatus = getExpirationStatus(daysUntilExpiration);

      return {
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity),
        unit: item.unit,
        location: item.location || 'unspecified',
        category: item.category || 'uncategorized',
        expirationDate: item.expirationDate?.toISOString() || null,
        bestBeforeDate: item.bestBeforeDate?.toISOString() || null,
        purchaseDate: item.purchaseDate?.toISOString() || null,
        price: item.price ? Number(item.price) : null,
        notes: item.notes,
        daysUntilExpiration,
        expirationStatus,
        createdAt: item.createdAt.toISOString(),
        createdBy: item.createdBy,
        updatedAt: item.updatedAt?.toISOString()
      };
    });

    // Calculate summary statistics
    const summary = {
      totalItems: items.length,
      byLocation: {},
      byStatus: {
        fresh: 0,
        expiring_soon: 0,
        expired: 0,
        no_expiry: 0
      }
    };

    items.forEach(item => {
      if (!summary.byLocation[item.location]) {
        summary.byLocation[item.location] = 0;
      }
      summary.byLocation[item.location]++;

      if (summary.byStatus[item.expirationStatus] !== undefined) {
        summary.byStatus[item.expirationStatus]++;
      }
    });

    res.json({
      items,
      pagination: {
        page: 1,
        pageSize: items.length,
        total: items.length,
        totalPages: 1
      },
      summary
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.householdId, userId: req.user?.id }, 'Failed to list household items');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching items'
    });
  }
});

// POST /api/v1/households/:householdId/items - Add new item
router.post('/households/:householdId/items', authenticateToken, async (req, res) => {
  try {
    const { householdId } = req.params;
    const userId = req.user.id;

    // Check if user is a member of the household
    const membership = await householdRepository.getUserMembership(householdId, userId);
    if (!membership) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a member of this household'
      });
    }

    // Check if viewer role (viewers cannot add items)
    if (membership.role === 'viewer') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Viewer role cannot add items'
      });
    }

    const {
      name,
      quantity,
      unit,
      location,
      category,
      expirationDate,
      bestBeforeDate,
      purchaseDate,
      price,
      notes
    } = req.body;

    // Validate required fields
    if (!name || quantity === undefined || !unit) {
      return res.status(400).json({
        error: 'Invalid data',
        message: 'Name, quantity, and unit are required'
      });
    }

    // Create item with history
    const item = await inventoryRepository.createWithHistory({
      householdId,
      name,
      quantity,
      unit,
      location: location || 'unspecified',
      category: category || 'uncategorized',
      expirationDate: expirationDate ? new Date(expirationDate) : null,
      bestBeforeDate: bestBeforeDate ? new Date(bestBeforeDate) : null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      price: price || null,
      notes: notes || null,
      createdBy: userId
    }, userId);

    // Log activity
    await activityLogRepository.logItemCreated(item, userId, req);

    // Broadcast item added event
    if (req.io) {
      broadcastToHousehold(req.io, householdId, 'item.added', {
        item: {
          id: item.id,
          name: item.name,
          quantity: Number(item.quantity),
          location: item.location
        },
        addedBy: userId,
        timestamp: item.createdAt.toISOString()
      });
      logger.debug({ householdId, event: 'item.added', itemId: item.id }, 'Broadcasting Socket.IO event');
    }

    const daysUntilExpiration = calculateDaysUntilExpiration(item.expirationDate);
    const expirationStatus = getExpirationStatus(daysUntilExpiration);

    res.status(201).json({
      id: item.id,
      name: item.name,
      quantity: Number(item.quantity),
      unit: item.unit,
      location: item.location,
      category: item.category,
      expirationDate: item.expirationDate?.toISOString() || null,
      daysUntilExpiration,
      expirationStatus,
      createdAt: item.createdAt.toISOString(),
      createdBy: item.createdBy
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.householdId, userId: req.user?.id }, 'Failed to create inventory item');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while creating item'
    });
  }
});

// GET /api/v1/households/:householdId/items/:itemId - Get item details
router.get('/households/:householdId/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { householdId, itemId } = req.params;
    const userId = req.user.id;

    // Check if user is a member of the household
    const membership = await householdRepository.getUserMembership(householdId, userId);
    if (!membership) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a member of this household'
      });
    }

    // Find the item with history
    const item = await inventoryRepository.findByIdWithHistory(itemId);
    if (!item || item.householdId !== householdId) {
      return res.status(404).json({
        error: 'Item not found',
        message: `Item with id ${itemId} not found in this household`
      });
    }

    const daysUntilExpiration = calculateDaysUntilExpiration(item.expirationDate);
    const expirationStatus = getExpirationStatus(daysUntilExpiration);

    // Format history
    const history = item.histories?.map(h => ({
      action: h.action,
      timestamp: h.timestamp.toISOString(),
      user: h.user?.displayName || 'Unknown'
    })) || [];

    // Set ETag header for optimistic concurrency
    res.setHeader('ETag', `W/"${item.rowVersion}"`);

    res.json({
      id: item.id,
      name: item.name,
      quantity: Number(item.quantity),
      unit: item.unit,
      location: item.location,
      category: item.category,
      expirationDate: item.expirationDate?.toISOString() || null,
      bestBeforeDate: item.bestBeforeDate?.toISOString() || null,
      purchaseDate: item.purchaseDate?.toISOString() || null,
      price: item.price ? Number(item.price) : null,
      notes: item.notes,
      daysUntilExpiration,
      expirationStatus,
      history,
      createdAt: item.createdAt.toISOString(),
      createdBy: {
        userId: item.createdBy,
        displayName: item.creator?.displayName || 'Unknown'
      }
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.householdId, itemId: req.params.itemId, userId: req.user?.id }, 'Failed to get inventory item details');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching item'
    });
  }
});

// PATCH /api/v1/households/:householdId/items/:itemId - Update item with ETag support
router.patch('/households/:householdId/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { householdId, itemId } = req.params;
    const userId = req.user.id;

    // Check if user is a member of the household
    const membership = await householdRepository.getUserMembership(householdId, userId);
    if (!membership) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a member of this household'
      });
    }

    // Check if viewer role (viewers cannot edit items)
    if (membership.role === 'viewer') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Viewer role cannot edit items'
      });
    }

    // Check for If-Match header (required for optimistic concurrency)
    const ifMatch = req.headers['if-match'];
    if (!ifMatch) {
      return res.status(428).json({
        error: 'Precondition Required',
        message: 'If-Match header is required for updates'
      });
    }

    // Extract version from ETag
    const versionMatch = ifMatch.match(/^(?:W\/)?"([^"]+)"$/);
    if (!versionMatch) {
      return res.status(400).json({
        error: 'Invalid ETag format',
        message: 'If-Match header must contain a valid ETag'
      });
    }

    const clientVersion = parseInt(versionMatch[1]);
    if (isNaN(clientVersion)) {
      const item = await inventoryRepository.findById(itemId);
      if (!item || item.householdId !== householdId) {
        return res.status(404).json({
          error: 'Item not found',
          message: `Item with id ${itemId} not found in this household`
        });
      }
      return res.status(409).json({
        error: 'Conflict',
        message: 'Invalid or stale ETag provided',
        currentState: {
          id: item.id,
          name: item.name,
          quantity: Number(item.quantity),
          unit: item.unit,
          location: item.location,
          category: item.category,
          expirationDate: item.expirationDate?.toISOString() || null,
          version: item.rowVersion,
          updatedAt: item.updatedAt?.toISOString()
        }
      });
    }

    // Build update data
    const updates = req.body;
    const updateData = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.quantity !== undefined) {
      if (updates.quantity < 0) {
        return res.status(400).json({
          error: 'Invalid data',
          message: 'Quantity cannot be negative'
        });
      }
      updateData.quantity = updates.quantity;
    }
    if (updates.unit !== undefined) updateData.unit = updates.unit;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.expirationDate !== undefined) {
      updateData.expirationDate = updates.expirationDate ? new Date(updates.expirationDate) : null;
    }
    if (updates.bestBeforeDate !== undefined) {
      updateData.bestBeforeDate = updates.bestBeforeDate ? new Date(updates.bestBeforeDate) : null;
    }
    if (updates.purchaseDate !== undefined) {
      updateData.purchaseDate = updates.purchaseDate ? new Date(updates.purchaseDate) : null;
    }
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    // Update with version check
    const result = await inventoryRepository.updateWithVersionCheck(itemId, updateData, clientVersion, userId);

    if (result.error === 'not_found') {
      return res.status(404).json({
        error: 'Item not found',
        message: `Item with id ${itemId} not found in this household`
      });
    }

    if (result.conflict) {
      res.setHeader('ETag', `W/"${result.currentState.rowVersion}"`);
      return res.status(409).json({
        error: 'Conflict',
        message: 'Item has been modified by another user',
        currentState: {
          id: result.currentState.id,
          name: result.currentState.name,
          quantity: Number(result.currentState.quantity),
          unit: result.currentState.unit,
          location: result.currentState.location,
          category: result.currentState.category,
          expirationDate: result.currentState.expirationDate?.toISOString() || null,
          version: result.currentState.rowVersion,
          updatedAt: result.currentState.updatedAt?.toISOString()
        }
      });
    }

    const item = result.item;

    // Log activity
    await activityLogRepository.logItemUpdated(item, updateData, userId, req);

    // Broadcast item update event
    if (req.io) {
      broadcastToHousehold(req.io, householdId, 'item.updated', {
        itemId: item.id,
        changes: updates,
        updatedBy: userId,
        timestamp: item.updatedAt.toISOString()
      });
      logger.debug({ householdId, event: 'item.updated', itemId: item.id }, 'Broadcasting Socket.IO event');
    }

    // Set new ETag header
    res.setHeader('ETag', `W/"${item.rowVersion}"`);

    res.json({
      id: item.id,
      name: item.name,
      quantity: Number(item.quantity),
      unit: item.unit,
      updatedAt: item.updatedAt.toISOString(),
      updatedBy: item.updatedBy,
      version: item.rowVersion
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.householdId, itemId: req.params.itemId, userId: req.user?.id }, 'Failed to update inventory item');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while updating item'
    });
  }
});

// GET /api/v1/households/:householdId/items/expiring - Get expiring items
router.get('/households/:householdId/items/expiring', authenticateToken, async (req, res) => {
  try {
    const { householdId } = req.params;
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 7;

    // Check if user is a member of the household
    const membership = await householdRepository.getUserMembership(householdId, userId);
    if (!membership) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a member of this household'
      });
    }

    const rawItems = await inventoryRepository.findExpiringItems(householdId, days);

    const items = rawItems.map(item => {
      const daysUntilExpiration = calculateDaysUntilExpiration(item.expirationDate);
      const expirationStatus = getExpirationStatus(daysUntilExpiration);

      return {
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity),
        unit: item.unit,
        location: item.location || 'unspecified',
        category: item.category || 'uncategorized',
        expirationDate: item.expirationDate?.toISOString() || null,
        daysUntilExpiration,
        expirationStatus,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt?.toISOString()
      };
    });

    res.json({
      items,
      count: items.length,
      filterDays: days
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.householdId, userId: req.user?.id, days: req.query.days }, 'Failed to get expiring items');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching expiring items'
    });
  }
});

// DELETE /api/v1/households/:householdId/items/:itemId - Delete item
router.delete('/households/:householdId/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { householdId, itemId } = req.params;
    const userId = req.user.id;

    // Check if user is a member of the household
    const membership = await householdRepository.getUserMembership(householdId, userId);
    if (!membership) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a member of this household'
      });
    }

    // Check if viewer role (viewers cannot delete items)
    if (membership.role === 'viewer') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Viewer role cannot delete items'
      });
    }

    // Find item first to verify household
    const existingItem = await inventoryRepository.findById(itemId);
    if (!existingItem || existingItem.householdId !== householdId) {
      return res.status(404).json({
        error: 'Item not found',
        message: `Item with id ${itemId} not found in this household`
      });
    }

    // Delete with history
    const deleted = await inventoryRepository.deleteWithHistory(itemId, userId);

    // Log activity
    await activityLogRepository.logItemDeleted(existingItem, userId, req);

    // Broadcast item deleted event
    if (req.io) {
      broadcastToHousehold(req.io, householdId, 'item.deleted', {
        itemId,
        deletedBy: userId,
        timestamp: new Date().toISOString()
      });
      logger.debug({ householdId, event: 'item.deleted', itemId }, 'Broadcasting Socket.IO event');
    }

    res.status(204).send();
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.householdId, itemId: req.params.itemId, userId: req.user?.id }, 'Failed to delete inventory item');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while deleting item'
    });
  }
});

// POST /api/v1/households/:householdId/items/:itemId/consume - Mark item as consumed
router.post('/households/:householdId/items/:itemId/consume', authenticateToken, async (req, res) => {
  try {
    const { householdId, itemId } = req.params;
    const userId = req.user.id;
    const { quantity, notes } = req.body;

    // Check if user is a member of the household
    const membership = await householdRepository.getUserMembership(householdId, userId);
    if (!membership) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a member of this household'
      });
    }

    // Check if viewer role (viewers cannot consume items)
    if (membership.role === 'viewer') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Viewer role cannot consume items'
      });
    }

    // Validate quantity
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        error: 'Invalid data',
        message: 'Quantity must be a positive number'
      });
    }

    // Find item to validate
    const item = await inventoryRepository.findById(itemId);
    if (!item || item.householdId !== householdId) {
      return res.status(404).json({
        error: 'Item not found',
        message: `Item with id ${itemId} not found in this household`
      });
    }

    // Check if quantity exceeds available
    if (quantity > Number(item.quantity)) {
      return res.status(400).json({
        error: 'Invalid quantity',
        message: 'Quantity exceeds available'
      });
    }

    // Consume item
    const result = await inventoryRepository.consumeItem(itemId, quantity, userId, notes);

    // Log activity
    await activityLogRepository.logItemConsumed(item, quantity, userId, req);

    res.json({
      id: itemId,
      remainingQuantity: result.remainingQuantity,
      consumedQuantity: quantity,
      consumedAt: new Date().toISOString(),
      consumedBy: userId
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.householdId, itemId: req.params.itemId, userId: req.user?.id, quantity: req.body?.quantity }, 'Failed to consume inventory item');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while consuming item'
    });
  }
});

// POST /api/v1/households/:householdId/items/:itemId/waste - Mark item as wasted
router.post('/households/:householdId/items/:itemId/waste', authenticateToken, async (req, res) => {
  try {
    const { householdId, itemId } = req.params;
    const userId = req.user.id;
    const { quantity, reason, notes } = req.body;

    // Check if user is a member of the household
    const membership = await householdRepository.getUserMembership(householdId, userId);
    if (!membership) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a member of this household'
      });
    }

    // Check if viewer role (viewers cannot waste items)
    if (membership.role === 'viewer') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Viewer role cannot waste items'
      });
    }

    // Validate quantity
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        error: 'Invalid data',
        message: 'Quantity must be a positive number'
      });
    }

    // Validate reason
    if (!reason) {
      return res.status(400).json({
        error: 'Invalid data',
        message: 'Reason is required'
      });
    }

    // Find item to validate
    const item = await inventoryRepository.findById(itemId);
    if (!item || item.householdId !== householdId) {
      return res.status(404).json({
        error: 'Item not found',
        message: `Item with id ${itemId} not found in this household`
      });
    }

    // Check if quantity exceeds available
    if (quantity > Number(item.quantity)) {
      return res.status(400).json({
        error: 'Invalid quantity',
        message: 'Quantity exceeds available'
      });
    }

    // Waste item
    const result = await inventoryRepository.wasteItem(itemId, quantity, reason, userId, notes);

    // Log activity
    await activityLogRepository.logItemWasted(item, quantity, reason, userId, req);

    res.json({
      id: itemId,
      remainingQuantity: result.remainingQuantity,
      wastedQuantity: quantity,
      reason,
      wastedAt: new Date().toISOString(),
      wastedBy: userId
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.householdId, itemId: req.params.itemId, userId: req.user?.id, quantity: req.body?.quantity, reason: req.body?.reason }, 'Failed to waste inventory item');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while wasting item'
    });
  }
});

module.exports = router;
