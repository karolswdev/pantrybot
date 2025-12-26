const express = require('express');
const router = express.Router();
const authMiddleware = require('./authMiddleware');
const { householdRepository, shoppingListRepository, userRepository, activityLogRepository } = require('./repositories');
const { logger } = require('./lib/logger');

// GET /api/v1/households/:householdId/shopping-lists
// List all shopping lists for a household
router.get('/:householdId/shopping-lists', authMiddleware, async (req, res) => {
  try {
    const { householdId } = req.params;
    const userId = req.user.id;

    // Check if user is a member of the household
    const membership = await householdRepository.getUserMembership(householdId, userId);
    if (!membership) {
      return res.status(403).json({ message: 'Forbidden - not a member of this household' });
    }

    // Get all shopping lists for the household
    const lists = await shoppingListRepository.findByHousehold(householdId);

    // Format response
    const listsWithCounts = lists.map(list => ({
      id: list.id,
      name: list.name,
      itemCount: list._count?.items || 0,
      completedCount: list.items?.length || 0,
      createdAt: list.createdAt.toISOString(),
      createdBy: list.creator?.displayName || 'Unknown',
      lastUpdated: list.lastUpdated?.toISOString() || list.createdAt.toISOString()
    }));

    res.json({ lists: listsWithCounts });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.householdId }, 'Failed to list shopping lists');
    res.status(500).json({ message: 'An error occurred while fetching shopping lists' });
  }
});

// GET /api/v1/households/:householdId/shopping-lists/:listId
// Get shopping list details with items
router.get('/:householdId/shopping-lists/:listId', authMiddleware, async (req, res) => {
  try {
    const { householdId, listId } = req.params;
    const userId = req.user.id;

    // Check if user is a member of the household
    const membership = await householdRepository.getUserMembership(householdId, userId);
    if (!membership) {
      return res.status(403).json({ message: 'Forbidden - not a member of this household' });
    }

    // Find the shopping list
    const list = await shoppingListRepository.findByIdWithItems(listId);
    if (!list || list.householdId !== householdId) {
      return res.status(404).json({ message: 'Shopping list not found' });
    }

    res.json({
      id: list.id,
      householdId: list.householdId,
      name: list.name,
      notes: list.notes,
      createdAt: list.createdAt.toISOString(),
      createdBy: list.creator?.displayName || 'Unknown',
      lastUpdated: list.lastUpdated?.toISOString() || list.createdAt.toISOString(),
      items: list.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity ? Number(item.quantity) : null,
        unit: item.unit,
        category: item.category,
        notes: item.notes,
        completed: item.completed,
        completedBy: item.completer?.displayName || null,
        completedAt: item.completedAt?.toISOString() || null,
        addedBy: item.adder?.displayName || 'Unknown',
        addedAt: item.addedAt.toISOString(),
        updatedAt: item.updatedAt?.toISOString() || item.addedAt.toISOString()
      }))
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.householdId, listId: req.params.listId }, 'Failed to get shopping list');
    res.status(500).json({ message: 'An error occurred while fetching shopping list' });
  }
});

// GET /api/v1/households/:householdId/shopping-lists/:listId/items
// Get all items for a shopping list
router.get('/:householdId/shopping-lists/:listId/items', authMiddleware, async (req, res) => {
  try {
    const { householdId, listId } = req.params;
    const userId = req.user.id;

    // Check if user is a member of the household
    const membership = await householdRepository.getUserMembership(householdId, userId);
    if (!membership) {
      return res.status(403).json({ message: 'Forbidden - not a member of this household' });
    }

    // Check if shopping list exists and belongs to household
    const list = await shoppingListRepository.findById(listId);
    if (!list || list.householdId !== householdId) {
      return res.status(404).json({ message: 'Shopping list not found' });
    }

    // Get all items for the list
    const items = await shoppingListRepository.getListItems(listId);

    res.json(items.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity ? Number(item.quantity) : null,
      unit: item.unit,
      category: item.category,
      notes: item.notes,
      completed: item.completed,
      completedBy: item.completer?.displayName || null,
      completedAt: item.completedAt?.toISOString() || null,
      addedBy: item.adder?.displayName || 'Unknown',
      addedAt: item.addedAt.toISOString(),
      updatedAt: item.updatedAt?.toISOString() || item.addedAt.toISOString()
    })));
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.householdId, listId: req.params.listId }, 'Failed to get shopping list items');
    res.status(500).json({ message: 'An error occurred while fetching shopping list items' });
  }
});

// POST /api/v1/households/:householdId/shopping-lists
// Create a new shopping list
router.post('/:householdId/shopping-lists', authMiddleware, async (req, res) => {
  try {
    const { householdId } = req.params;
    const userId = req.user.id;
    const { name, notes } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Check if user is a member of the household
    const membership = await householdRepository.getUserMembership(householdId, userId);
    if (!membership) {
      return res.status(403).json({ message: 'Forbidden - not a member of this household' });
    }

    // Get user details
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create new shopping list
    const newList = await shoppingListRepository.createList({
      householdId,
      name,
      notes: notes || null
    }, userId, user.displayName);

    // Log activity
    await activityLogRepository.logShoppingListCreated(newList, userId, req);

    res.status(201).json({
      id: newList.id,
      name: newList.name,
      notes: newList.notes,
      itemCount: 0,
      completedCount: 0,
      createdAt: newList.createdAt.toISOString(),
      createdBy: newList.creator?.displayName || user.displayName,
      lastUpdated: newList.lastUpdated?.toISOString() || newList.createdAt.toISOString()
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.householdId }, 'Failed to create shopping list');
    res.status(500).json({ message: 'An error occurred while creating shopping list' });
  }
});

// POST /api/v1/households/:householdId/shopping-lists/:listId/items
// Add item to shopping list
router.post('/:householdId/shopping-lists/:listId/items', authMiddleware, async (req, res) => {
  try {
    const { householdId, listId } = req.params;
    const userId = req.user.id;
    const { name, quantity, unit, category, notes } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Check if user is a member of the household
    const membership = await householdRepository.getUserMembership(householdId, userId);
    if (!membership) {
      return res.status(403).json({ message: 'Forbidden - not a member of this household' });
    }

    // Check if shopping list exists and belongs to household
    const list = await shoppingListRepository.findById(listId);
    if (!list || list.householdId !== householdId) {
      return res.status(404).json({ message: 'Shopping list not found' });
    }

    // Get user details
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create new item
    const newItem = await shoppingListRepository.addItem(listId, householdId, {
      name,
      quantity: quantity || null,
      unit: unit || null,
      category: category || null,
      notes: notes || null
    }, userId, user.displayName);

    // Log activity
    await activityLogRepository.logShoppingListItemAdded(list, newItem, userId, req);

    // Broadcast the event if io is available
    if (req.io) {
      req.io.to(`household-${householdId}`).emit('shoppinglist.item.added', {
        listId: listId,
        item: {
          id: newItem.id,
          name: newItem.name,
          quantity: newItem.quantity ? Number(newItem.quantity) : null,
          unit: newItem.unit,
          category: newItem.category,
          notes: newItem.notes,
          completed: newItem.completed,
          addedBy: newItem.adder?.displayName || user.displayName,
          addedAt: newItem.addedAt.toISOString()
        }
      });
    }

    res.status(201).json({
      id: newItem.id,
      name: newItem.name,
      quantity: newItem.quantity ? Number(newItem.quantity) : null,
      unit: newItem.unit,
      category: newItem.category,
      notes: newItem.notes,
      completed: newItem.completed,
      addedBy: newItem.adder?.displayName || user.displayName,
      addedAt: newItem.addedAt.toISOString()
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.householdId, listId: req.params.listId }, 'Failed to add shopping list item');
    res.status(500).json({ message: 'An error occurred while adding item' });
  }
});

// PATCH /api/v1/households/:householdId/shopping-lists/:listId/items/:itemId
// Update shopping list item (mainly for toggling completed status)
router.patch('/:householdId/shopping-lists/:listId/items/:itemId', authMiddleware, async (req, res) => {
  try {
    const { householdId, listId, itemId } = req.params;
    const userId = req.user.id;
    const { completed } = req.body;

    // Check if user is a member of the household
    const membership = await householdRepository.getUserMembership(householdId, userId);
    if (!membership) {
      return res.status(403).json({ message: 'Forbidden - not a member of this household' });
    }

    // Check if shopping list exists and belongs to household
    const list = await shoppingListRepository.findById(listId);
    if (!list || list.householdId !== householdId) {
      return res.status(404).json({ message: 'Shopping list not found' });
    }

    // Get user details
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update item
    let updatedItem;
    if (completed !== undefined) {
      updatedItem = await shoppingListRepository.markItemComplete(itemId, completed, userId);

      // Log activity if item was completed
      if (completed) {
        await activityLogRepository.logShoppingListItemCompleted(list, updatedItem, userId, req);
      }
    } else {
      updatedItem = await shoppingListRepository.updateItem(itemId, req.body);
    }

    // Broadcast the event if io is available
    if (req.io) {
      req.io.to(`household-${householdId}`).emit('shoppinglist.item.updated', {
        listId: listId,
        item: {
          id: updatedItem.id,
          name: updatedItem.name,
          quantity: updatedItem.quantity ? Number(updatedItem.quantity) : null,
          unit: updatedItem.unit,
          category: updatedItem.category,
          notes: updatedItem.notes,
          completed: updatedItem.completed,
          completedBy: updatedItem.completer?.displayName || null,
          completedAt: updatedItem.completedAt?.toISOString() || null,
          updatedAt: updatedItem.updatedAt?.toISOString()
        }
      });
    }

    res.json({
      id: updatedItem.id,
      name: updatedItem.name,
      quantity: updatedItem.quantity ? Number(updatedItem.quantity) : null,
      unit: updatedItem.unit,
      category: updatedItem.category,
      notes: updatedItem.notes,
      completed: updatedItem.completed,
      completedBy: updatedItem.completer?.displayName || null,
      completedAt: updatedItem.completedAt?.toISOString() || null,
      updatedAt: updatedItem.updatedAt?.toISOString()
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.householdId, listId: req.params.listId, itemId: req.params.itemId }, 'Failed to update shopping list item');
    res.status(500).json({ message: 'An error occurred while updating item' });
  }
});

module.exports = router;
