const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const authMiddleware = require('./authMiddleware');

// GET /api/v1/households/:householdId/shopping-lists
// List all shopping lists for a household
router.get('/:householdId/shopping-lists', authMiddleware, (req, res) => {
  const { householdId } = req.params;
  
  // Check if user is a member of the household
  const membership = db.household_members.find(
    m => m.householdId === householdId && m.userId === req.user.id
  );
  
  if (!membership) {
    return res.status(403).json({ message: 'Forbidden - not a member of this household' });
  }
  
  // Get all shopping lists for the household
  const lists = db.shoppingLists.filter(list => list.householdId === householdId);
  
  // Calculate item counts for each list
  const listsWithCounts = lists.map(list => {
    const items = db.shoppingListItems.filter(item => item.listId === list.id);
    const completedCount = items.filter(item => item.completed).length;
    
    return {
      id: list.id,
      name: list.name,
      itemCount: items.length,
      completedCount: completedCount,
      createdAt: list.createdAt,
      createdBy: list.createdByName,
      lastUpdated: list.lastUpdated
    };
  });
  
  res.json({ lists: listsWithCounts });
});

// POST /api/v1/households/:householdId/shopping-lists
// Create a new shopping list
router.post('/:householdId/shopping-lists', authMiddleware, (req, res) => {
  const { householdId } = req.params;
  const { name, notes } = req.body;
  
  // Validate required fields
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  
  // Check if user is a member of the household
  const membership = db.household_members.find(
    m => m.householdId === householdId && m.userId === req.user.id
  );
  
  if (!membership) {
    return res.status(403).json({ message: 'Forbidden - not a member of this household' });
  }
  
  // Get user details for createdByName
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Create new shopping list
  const now = new Date().toISOString();
  const newList = {
    id: uuidv4(),
    householdId: householdId,
    name: name,
    notes: notes || null,
    createdBy: req.user.id,
    createdByName: user.displayName,
    createdAt: now,
    lastUpdated: now
  };
  
  db.shoppingLists.push(newList);
  
  // Return the created list with initial counts
  res.status(201).json({
    id: newList.id,
    name: newList.name,
    notes: newList.notes,
    itemCount: 0,
    completedCount: 0,
    createdAt: newList.createdAt,
    createdBy: newList.createdByName,
    lastUpdated: newList.lastUpdated
  });
});

// POST /api/v1/households/:householdId/shopping-lists/:listId/items
// Add item to shopping list
router.post('/:householdId/shopping-lists/:listId/items', authMiddleware, (req, res) => {
  const { householdId, listId } = req.params;
  const { name, quantity, unit, category, notes } = req.body;
  
  // Validate required fields
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  
  // Check if user is a member of the household
  const membership = db.household_members.find(
    m => m.householdId === householdId && m.userId === req.user.id
  );
  
  if (!membership) {
    return res.status(403).json({ message: 'Forbidden - not a member of this household' });
  }
  
  // Check if shopping list exists and belongs to household
  const list = db.shoppingLists.find(
    l => l.id === listId && l.householdId === householdId
  );
  
  if (!list) {
    return res.status(404).json({ message: 'Shopping list not found' });
  }
  
  // Get user details for addedByName
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Create new item
  const now = new Date().toISOString();
  const newItem = {
    id: uuidv4(),
    listId: listId,
    householdId: householdId,
    name: name,
    quantity: quantity || null,
    unit: unit || null,
    category: category || null,
    notes: notes || null,
    completed: false,
    completedBy: null,
    completedAt: null,
    addedBy: req.user.id,
    addedByName: user.displayName,
    addedAt: now,
    updatedAt: now
  };
  
  db.shoppingListItems.push(newItem);
  
  // Update list's lastUpdated timestamp
  list.lastUpdated = now;
  
  // Broadcast the event if io is available
  if (req.io) {
    req.io.to(`household-${householdId}`).emit('shoppinglist.item.added', {
      listId: listId,
      item: {
        id: newItem.id,
        name: newItem.name,
        quantity: newItem.quantity,
        unit: newItem.unit,
        category: newItem.category,
        notes: newItem.notes,
        completed: newItem.completed,
        addedBy: newItem.addedByName,
        addedAt: newItem.addedAt
      }
    });
  }
  
  res.status(201).json({
    id: newItem.id,
    name: newItem.name,
    quantity: newItem.quantity,
    unit: newItem.unit,
    category: newItem.category,
    notes: newItem.notes,
    completed: newItem.completed,
    addedBy: newItem.addedByName,
    addedAt: newItem.addedAt
  });
});

// PATCH /api/v1/households/:householdId/shopping-lists/:listId/items/:itemId
// Update shopping list item (mainly for toggling completed status)
router.patch('/:householdId/shopping-lists/:listId/items/:itemId', authMiddleware, (req, res) => {
  const { householdId, listId, itemId } = req.params;
  const { completed } = req.body;
  
  // Check if user is a member of the household
  const membership = db.household_members.find(
    m => m.householdId === householdId && m.userId === req.user.id
  );
  
  if (!membership) {
    return res.status(403).json({ message: 'Forbidden - not a member of this household' });
  }
  
  // Find the item
  const item = db.shoppingListItems.find(
    i => i.id === itemId && i.listId === listId && i.householdId === householdId
  );
  
  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }
  
  // Get user details
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Update item
  const now = new Date().toISOString();
  if (completed !== undefined) {
    item.completed = completed;
    if (completed) {
      item.completedBy = req.user.id;
      item.completedAt = now;
    } else {
      item.completedBy = null;
      item.completedAt = null;
    }
  }
  item.updatedAt = now;
  
  // Update list's lastUpdated timestamp
  const list = db.shoppingLists.find(l => l.id === listId);
  if (list) {
    list.lastUpdated = now;
  }
  
  // Broadcast the event if io is available
  if (req.io) {
    req.io.to(`household-${householdId}`).emit('shoppinglist.item.updated', {
      listId: listId,
      item: {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        notes: item.notes,
        completed: item.completed,
        completedBy: item.completed ? user.displayName : null,
        completedAt: item.completedAt,
        updatedAt: item.updatedAt
      }
    });
  }
  
  res.json({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    notes: item.notes,
    completed: item.completed,
    completedBy: item.completed ? user.displayName : null,
    completedAt: item.completedAt,
    updatedAt: item.updatedAt
  });
});

module.exports = router;