const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { userRepository, householdRepository } = require('./repositories');
const { logger } = require('./lib/logger');

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
      const user = await userRepository.findById(decoded.sub);
      if (!user) {
        return next(new Error('Authentication failed: User not found'));
      }

      // Attach user info to socket
      socket.userId = decoded.sub;
      socket.userEmail = decoded.email;

      // Get user's household memberships
      const userHouseholds = await householdRepository.findUserHouseholds(decoded.sub);
      socket.households = userHouseholds.map(h => h.id);

      next();
    } catch (error) {
      logger.warn({ err: error, socketId: socket.id }, 'WebSocket authentication failed');
      next(new Error('Authentication failed: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    logger.info(
      { userId: socket.userId, socketId: socket.id, households: socket.households },
      'WebSocket client connected'
    );

    // Join household rooms
    if (socket.households && socket.households.length > 0) {
      socket.households.forEach(householdId => {
        const room = `household-${householdId}`;
        socket.join(room);
        logger.debug({ socketId: socket.id, room, householdId }, 'Socket joined room');
      });
    }

    // Handle explicit household context setting (optional)
    socket.on('set-household', (householdId) => {
      if (socket.households.includes(householdId)) {
        socket.currentHousehold = householdId;
        logger.debug({ socketId: socket.id, householdId }, 'Socket set current household');
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info(
        { userId: socket.userId, socketId: socket.id, reason },
        'WebSocket client disconnected'
      );
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
  logger.debug({ eventType, room, householdId, payloadKeys: Object.keys(payload || {}) }, 'Broadcast event to household');
}

module.exports = {
  initializeSocket,
  broadcastToHousehold
};
