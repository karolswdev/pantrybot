const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { inventoryItems, itemHistory, household_members } = require('./db');
const authenticateToken = require('./authMiddleware');

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

// Helper function to check if user is a member of the household
function isHouseholdMember(userId, householdId) {
  return household_members.some(
    member => member.userId === userId && member.householdId === householdId
  );
}

// GET /api/v1/households/:householdId/items - List household items
router.get('/households/:householdId/items', authenticateToken, (req, res) => {
  const { householdId } = req.params;
  const userId = req.user.id;
  
  // Check if user is a member of the household
  if (!isHouseholdMember(userId, householdId)) {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'You are not a member of this household'
    });
  }
  
  // Get items for this household
  const items = inventoryItems
    .filter(item => item.householdId === householdId)
    .map(item => {
      const daysUntilExpiration = calculateDaysUntilExpiration(item.expirationDate);
      const expirationStatus = getExpirationStatus(daysUntilExpiration);
      
      return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        location: item.location || 'unspecified',
        category: item.category || 'uncategorized',
        expirationDate: item.expirationDate,
        bestBeforeDate: item.bestBeforeDate,
        purchaseDate: item.purchaseDate,
        price: item.price,
        notes: item.notes,
        daysUntilExpiration,
        expirationStatus,
        createdAt: item.createdAt,
        createdBy: item.createdBy,
        updatedAt: item.updatedAt
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Calculate summary statistics
  const summary = {
    totalItems: items.length,
    byLocation: {},
    byStatus: {
      fresh: 0,
      expiringSoon: 0,
      expired: 0,
      no_expiry: 0
    }
  };
  
  items.forEach(item => {
    // Count by location
    if (!summary.byLocation[item.location]) {
      summary.byLocation[item.location] = 0;
    }
    summary.byLocation[item.location]++;
    
    // Count by status
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
});

// POST /api/v1/households/:householdId/items - Add new item
router.post('/households/:householdId/items', authenticateToken, (req, res) => {
  const { householdId } = req.params;
  const userId = req.user.id;
  
  // Check if user is a member of the household
  const member = household_members.find(
    m => m.userId === userId && m.householdId === householdId
  );
  
  if (!member) {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'You are not a member of this household'
    });
  }
  
  // Check if viewer role (viewers cannot add items)
  if (member.role === 'viewer') {
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
  
  // Create new item
  const newItem = {
    id: uuidv4(),
    householdId,
    name,
    quantity,
    unit,
    location: location || 'unspecified',
    category: category || 'uncategorized',
    expirationDate: expirationDate || null,
    bestBeforeDate: bestBeforeDate || null,
    purchaseDate: purchaseDate || null,
    price: price || null,
    notes: notes || null,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rowVersion: 1
  };
  
  // Add to inventory
  inventoryItems.push(newItem);
  
  // Add to history
  itemHistory.push({
    id: uuidv4(),
    itemId: newItem.id,
    householdId,
    action: 'created',
    quantity: null,
    reason: null,
    notes: `Item "${name}" added to inventory`,
    previousLocation: null,
    newLocation: newItem.location,
    userId,
    timestamp: new Date().toISOString()
  });
  
  // Calculate expiration info for response
  const daysUntilExpiration = calculateDaysUntilExpiration(newItem.expirationDate);
  const expirationStatus = getExpirationStatus(daysUntilExpiration);
  
  res.status(201).json({
    id: newItem.id,
    name: newItem.name,
    quantity: newItem.quantity,
    unit: newItem.unit,
    location: newItem.location,
    category: newItem.category,
    expirationDate: newItem.expirationDate,
    daysUntilExpiration,
    expirationStatus,
    createdAt: newItem.createdAt,
    createdBy: newItem.createdBy
  });
});

// GET /api/v1/households/:householdId/items/:itemId - Get item details
router.get('/households/:householdId/items/:itemId', authenticateToken, (req, res) => {
  const { householdId, itemId } = req.params;
  const userId = req.user.id;
  
  // Check if user is a member of the household
  if (!isHouseholdMember(userId, householdId)) {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'You are not a member of this household'
    });
  }
  
  // Find the item
  const item = inventoryItems.find(
    i => i.id === itemId && i.householdId === householdId
  );
  
  if (!item) {
    return res.status(404).json({ 
      error: 'Item not found',
      message: `Item with id ${itemId} not found in this household`
    });
  }
  
  // Get item history
  const history = itemHistory
    .filter(h => h.itemId === itemId)
    .map(h => ({
      action: h.action,
      timestamp: h.timestamp,
      user: 'Mock User' // In real implementation, would look up user display name
    }))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Calculate expiration info
  const daysUntilExpiration = calculateDaysUntilExpiration(item.expirationDate);
  const expirationStatus = getExpirationStatus(daysUntilExpiration);
  
  // Set ETag header for optimistic concurrency
  res.setHeader('ETag', `W/"${item.rowVersion}"`);
  
  res.json({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    location: item.location,
    category: item.category,
    expirationDate: item.expirationDate,
    bestBeforeDate: item.bestBeforeDate,
    purchaseDate: item.purchaseDate,
    price: item.price,
    notes: item.notes,
    daysUntilExpiration,
    expirationStatus,
    history,
    createdAt: item.createdAt,
    createdBy: {
      userId: item.createdBy,
      displayName: 'John Doe' // Mock display name
    }
  });
});

// PATCH /api/v1/households/:householdId/items/:itemId - Update item with ETag support
router.patch('/households/:householdId/items/:itemId', authenticateToken, (req, res) => {
  const { householdId, itemId } = req.params;
  const userId = req.user.id;
  
  // Check if user is a member of the household
  const member = household_members.find(
    m => m.userId === userId && m.householdId === householdId
  );
  
  if (!member) {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'You are not a member of this household'
    });
  }
  
  // Check if viewer role (viewers cannot edit items)
  if (member.role === 'viewer') {
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
  
  // Extract version from ETag (format: W/"version" or just "version")
  const versionMatch = ifMatch.match(/W?\/"?([^"]+)"?/);
  if (!versionMatch) {
    return res.status(400).json({ 
      error: 'Invalid ETag format',
      message: 'If-Match header must contain a valid ETag'
    });
  }
  
  // Try to parse as integer, if it fails treat as stale
  const clientVersion = parseInt(versionMatch[1]);
  if (isNaN(clientVersion)) {
    // Non-numeric version, treat as stale/invalid - need to get item first
    const itemIndex = inventoryItems.findIndex(
      i => i.id === itemId && i.householdId === householdId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ 
        error: 'Item not found',
        message: `Item with id ${itemId} not found in this household`
      });
    }
    
    const item = inventoryItems[itemIndex];
    return res.status(409).json({ 
      error: 'Conflict',
      message: 'Invalid or stale ETag provided',
      currentState: {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        location: item.location,
        category: item.category,
        expirationDate: item.expirationDate,
        version: item.rowVersion,
        updatedAt: item.updatedAt
      }
    });
  }
  
  // Find the item
  const itemIndex = inventoryItems.findIndex(
    i => i.id === itemId && i.householdId === householdId
  );
  
  if (itemIndex === -1) {
    return res.status(404).json({ 
      error: 'Item not found',
      message: `Item with id ${itemId} not found in this household`
    });
  }
  
  const item = inventoryItems[itemIndex];
  
  // Check version for optimistic concurrency
  if (item.rowVersion !== clientVersion) {
    // Return 409 Conflict with current state
    const daysUntilExpiration = calculateDaysUntilExpiration(item.expirationDate);
    const expirationStatus = getExpirationStatus(daysUntilExpiration);
    
    res.setHeader('ETag', `W/"${item.rowVersion}"`);
    return res.status(409).json({ 
      error: 'Conflict',
      message: 'Item has been modified by another user',
      currentState: {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        location: item.location,
        category: item.category,
        expirationDate: item.expirationDate,
        version: item.rowVersion,
        updatedAt: item.updatedAt
      }
    });
  }
  
  // Apply updates (partial update)
  const updates = req.body;
  const updatedFields = [];
  
  // Validate and apply each field
  if (updates.name !== undefined) {
    item.name = updates.name;
    updatedFields.push('name');
  }
  if (updates.quantity !== undefined) {
    if (updates.quantity < 0) {
      return res.status(400).json({ 
        error: 'Invalid data',
        message: 'Quantity cannot be negative'
      });
    }
    item.quantity = updates.quantity;
    updatedFields.push('quantity');
  }
  if (updates.unit !== undefined) {
    item.unit = updates.unit;
    updatedFields.push('unit');
  }
  if (updates.location !== undefined) {
    item.location = updates.location;
    updatedFields.push('location');
  }
  if (updates.category !== undefined) {
    item.category = updates.category;
    updatedFields.push('category');
  }
  if (updates.expirationDate !== undefined) {
    item.expirationDate = updates.expirationDate;
    updatedFields.push('expirationDate');
  }
  if (updates.bestBeforeDate !== undefined) {
    item.bestBeforeDate = updates.bestBeforeDate;
    updatedFields.push('bestBeforeDate');
  }
  if (updates.purchaseDate !== undefined) {
    item.purchaseDate = updates.purchaseDate;
    updatedFields.push('purchaseDate');
  }
  if (updates.price !== undefined) {
    item.price = updates.price;
    updatedFields.push('price');
  }
  if (updates.notes !== undefined) {
    item.notes = updates.notes;
    updatedFields.push('notes');
  }
  
  // Update metadata
  item.updatedAt = new Date().toISOString();
  item.updatedBy = userId;
  item.rowVersion = item.rowVersion + 1; // Increment version
  
  // Add to history
  itemHistory.push({
    id: uuidv4(),
    itemId: item.id,
    householdId,
    action: 'updated',
    quantity: null,
    reason: null,
    notes: `Updated fields: ${updatedFields.join(', ')}`,
    previousLocation: null,
    newLocation: null,
    userId,
    timestamp: new Date().toISOString()
  });
  
  // Set new ETag header
  res.setHeader('ETag', `W/"${item.rowVersion}"`);
  
  // Return updated item
  res.json({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    updatedAt: item.updatedAt,
    updatedBy: item.updatedBy,
    version: item.rowVersion
  });
});

// DELETE /api/v1/households/:householdId/items/:itemId - Delete item
router.delete('/households/:householdId/items/:itemId', authenticateToken, (req, res) => {
  const { householdId, itemId } = req.params;
  const userId = req.user.id;
  
  // Check if user is a member of the household
  const member = household_members.find(
    m => m.userId === userId && m.householdId === householdId
  );
  
  if (!member) {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'You are not a member of this household'
    });
  }
  
  // Check if viewer role (viewers cannot delete items)
  if (member.role === 'viewer') {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'Viewer role cannot delete items'
    });
  }
  
  // Find the item index
  const itemIndex = inventoryItems.findIndex(
    i => i.id === itemId && i.householdId === householdId
  );
  
  if (itemIndex === -1) {
    return res.status(404).json({ 
      error: 'Item not found',
      message: `Item with id ${itemId} not found in this household`
    });
  }
  
  const item = inventoryItems[itemIndex];
  
  // Add deletion to history before removing
  itemHistory.push({
    id: uuidv4(),
    itemId: item.id,
    householdId,
    action: 'deleted',
    quantity: null,
    reason: null,
    notes: `Item "${item.name}" deleted from inventory`,
    previousLocation: item.location,
    newLocation: null,
    userId,
    timestamp: new Date().toISOString()
  });
  
  // Remove the item from inventory
  inventoryItems.splice(itemIndex, 1);
  
  // Return 204 No Content
  res.status(204).send();
});

// POST /api/v1/households/:householdId/items/:itemId/consume - Mark item as consumed
router.post('/households/:householdId/items/:itemId/consume', authenticateToken, (req, res) => {
  const { householdId, itemId } = req.params;
  const userId = req.user.id;
  const { quantity, notes } = req.body;
  
  // Check if user is a member of the household
  const member = household_members.find(
    m => m.userId === userId && m.householdId === householdId
  );
  
  if (!member) {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'You are not a member of this household'
    });
  }
  
  // Check if viewer role (viewers cannot consume items)
  if (member.role === 'viewer') {
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
  
  // Find the item
  const itemIndex = inventoryItems.findIndex(
    i => i.id === itemId && i.householdId === householdId
  );
  
  if (itemIndex === -1) {
    return res.status(404).json({ 
      error: 'Item not found',
      message: `Item with id ${itemId} not found in this household`
    });
  }
  
  const item = inventoryItems[itemIndex];
  
  // Check if quantity exceeds available
  if (quantity > item.quantity) {
    return res.status(400).json({ 
      error: 'Invalid quantity',
      message: 'Quantity exceeds available'
    });
  }
  
  // Calculate remaining quantity
  const remainingQuantity = item.quantity - quantity;
  const consumedAt = new Date().toISOString();
  
  // Update item quantity or remove if fully consumed
  if (remainingQuantity > 0) {
    item.quantity = remainingQuantity;
    item.updatedAt = consumedAt;
    item.updatedBy = userId;
    item.rowVersion = item.rowVersion + 1;
  } else {
    // Remove item if fully consumed
    inventoryItems.splice(itemIndex, 1);
  }
  
  // Add to history
  itemHistory.push({
    id: uuidv4(),
    itemId: item.id,
    householdId,
    action: 'consumed',
    quantity: quantity,
    reason: null,
    notes: notes || `Consumed ${quantity} ${item.unit} of "${item.name}"`,
    previousLocation: null,
    newLocation: null,
    userId,
    timestamp: consumedAt
  });
  
  // Return response
  res.json({
    id: item.id,
    remainingQuantity: remainingQuantity,
    consumedQuantity: quantity,
    consumedAt: consumedAt,
    consumedBy: userId
  });
});

// POST /api/v1/households/:householdId/items/:itemId/waste - Mark item as wasted
router.post('/households/:householdId/items/:itemId/waste', authenticateToken, (req, res) => {
  const { householdId, itemId } = req.params;
  const userId = req.user.id;
  const { quantity, reason, notes } = req.body;
  
  // Check if user is a member of the household
  const member = household_members.find(
    m => m.userId === userId && m.householdId === householdId
  );
  
  if (!member) {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'You are not a member of this household'
    });
  }
  
  // Check if viewer role (viewers cannot waste items)
  if (member.role === 'viewer') {
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
  
  // Find the item
  const itemIndex = inventoryItems.findIndex(
    i => i.id === itemId && i.householdId === householdId
  );
  
  if (itemIndex === -1) {
    return res.status(404).json({ 
      error: 'Item not found',
      message: `Item with id ${itemId} not found in this household`
    });
  }
  
  const item = inventoryItems[itemIndex];
  
  // Check if quantity exceeds available
  if (quantity > item.quantity) {
    return res.status(400).json({ 
      error: 'Invalid quantity',
      message: 'Quantity exceeds available'
    });
  }
  
  // Calculate remaining quantity
  const remainingQuantity = item.quantity - quantity;
  const wastedAt = new Date().toISOString();
  
  // Update item quantity or remove if fully wasted
  if (remainingQuantity > 0) {
    item.quantity = remainingQuantity;
    item.updatedAt = wastedAt;
    item.updatedBy = userId;
    item.rowVersion = item.rowVersion + 1;
  } else {
    // Remove item if fully wasted
    inventoryItems.splice(itemIndex, 1);
  }
  
  // Add to history
  itemHistory.push({
    id: uuidv4(),
    itemId: item.id,
    householdId,
    action: 'wasted',
    quantity: quantity,
    reason: reason,
    notes: notes || `Wasted ${quantity} ${item.unit} of "${item.name}" - Reason: ${reason}`,
    previousLocation: null,
    newLocation: null,
    userId,
    timestamp: wastedAt
  });
  
  // Return response
  res.json({
    id: item.id,
    remainingQuantity: remainingQuantity,
    wastedQuantity: quantity,
    reason: reason,
    wastedAt: wastedAt,
    wastedBy: userId
  });
});

module.exports = router;