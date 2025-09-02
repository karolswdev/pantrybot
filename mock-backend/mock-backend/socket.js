const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('./db');

// JWT secret (matching authRoutes.js)
const JWT_SECRET = process.env.JWT_SECRET || 'mock-secret-key-for-development-only';

// Initialize Socket.IO server
function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      // Extract token from handshake auth
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication failed: No token provided'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Find user in database
      const user = db.users.find(u => u.id === decoded.sub);
      if (!user) {
        return next(new Error('Authentication failed: User not found'));
      }

      // Attach user info to socket
      socket.userId = decoded.sub;
      socket.userEmail = decoded.email;
      
      // Get user's household memberships
      const memberships = db.household_members.filter(m => m.userId === decoded.sub);
      socket.households = memberships.map(m => m.householdId);
      
      next();
    } catch (error) {
      console.error('WebSocket authentication error:', error.message);
      next(new Error('Authentication failed: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`WebSocket client connected: userId=${socket.userId}, socketId=${socket.id}`);
    
    // Join household rooms
    if (socket.households && socket.households.length > 0) {
      socket.households.forEach(householdId => {
        const room = `household-${householdId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined room: ${room}`);
      });
    }

    // Handle explicit household context setting (optional)
    socket.on('set-household', (householdId) => {
      if (socket.households.includes(householdId)) {
        socket.currentHousehold = householdId;
        console.log(`Socket ${socket.id} set current household: ${householdId}`);
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`WebSocket client disconnected: userId=${socket.userId}, socketId=${socket.id}, reason=${reason}`);
    });

    // Send initial connection success event
    socket.emit('connected', {
      userId: socket.userId,
      households: socket.households
    });
  });

  return io;
}

// Export functions for broadcasting events
function broadcastToHousehold(io, householdId, eventType, payload) {
  const room = `household-${householdId}`;
  io.to(room).emit(eventType, {
    type: eventType,
    householdId: householdId,
    payload: payload
  });
  console.log(`Broadcast ${eventType} to room ${room}:`, payload);
}

module.exports = {
  initializeSocket,
  broadcastToHousehold
};