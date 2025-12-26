const express = require('express');
const authMiddleware = require('./authMiddleware');
const { userRepository, householdRepository, invitationRepository, activityLogRepository } = require('./repositories');
const { logger, maskEmail } = require('./lib/logger');

const router = express.Router();

// Apply authentication middleware to all household routes
router.use(authMiddleware);

// GET /api/v1/households - List user's households
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const userHouseholds = await householdRepository.findUserHouseholds(userId);

    const response = userHouseholds.map(h => ({
      id: h.id,
      name: h.name,
      description: h.description || '',
      role: h.role,
      memberCount: h.memberCount,
      itemCount: h.itemCount,
      expiringItemCount: 0, // Will be calculated when we have inventory data
      createdAt: h.createdAt.toISOString()
    }));

    res.status(200).json({
      households: response,
      total: response.length
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, userId: req.user?.id }, 'Failed to list households');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching households'
    });
  }
});

// POST /api/v1/households - Create new household
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, timezone } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name is required'
      });
    }

    // Create household with user as admin
    const household = await householdRepository.prisma.$transaction(async (tx) => {
      const newHousehold = await tx.household.create({
        data: {
          name,
          description: description || '',
          timezone: timezone || 'UTC',
          createdBy: userId
        }
      });

      await tx.householdMember.create({
        data: {
          householdId: newHousehold.id,
          userId,
          role: 'admin'
        }
      });

      return newHousehold;
    });

    // Log activity
    await activityLogRepository.log({
      householdId: household.id,
      userId,
      action: 'household.created',
      entityType: 'household',
      entityId: household.id,
      entityName: household.name,
      metadata: { timezone: household.timezone },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      id: household.id,
      name: household.name,
      description: household.description || '',
      timezone: household.timezone || 'UTC',
      createdAt: household.createdAt.toISOString(),
      createdBy: userId
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, userId: req.user?.id }, 'Failed to create household');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while creating household'
    });
  }
});

// GET /api/v1/households/:id - Get household details
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const householdId = req.params.id;

    // Find the household with members
    const household = await householdRepository.findByIdWithMembers(householdId);
    if (!household) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Household not found'
      });
    }

    // Check if user is a member of the household
    const membership = await householdRepository.getUserMembership(householdId, userId);
    if (!membership) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    // Format members
    const members = household.members.map(m => ({
      userId: m.userId,
      email: m.user.email,
      displayName: m.user.displayName,
      role: m.role,
      joinedAt: m.joinedAt.toISOString()
    }));

    // Get statistics
    const statistics = await householdRepository.getStatistics(householdId);

    res.status(200).json({
      id: household.id,
      name: household.name,
      description: household.description || '',
      timezone: household.timezone || 'UTC',
      members,
      statistics,
      createdAt: household.createdAt.toISOString()
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.id, userId: req.user?.id }, 'Failed to get household details');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching household details'
    });
  }
});

// GET /api/v1/households/:id/statistics - Get household statistics
router.get('/:id/statistics', async (req, res) => {
  try {
    const userId = req.user.id;
    const householdId = req.params.id;

    // Find the household
    const household = await householdRepository.findById(householdId);
    if (!household) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Household not found'
      });
    }

    // Check if user is a member of the household
    const membership = await householdRepository.getUserMembership(householdId, userId);
    if (!membership) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    const statistics = await householdRepository.getStatistics(householdId);

    res.status(200).json({ statistics });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.id, userId: req.user?.id }, 'Failed to get household statistics');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching household statistics'
    });
  }
});

// PUT /api/v1/households/:id - Update household
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const householdId = req.params.id;
    const { name, description, timezone } = req.body;

    // Find the household
    const household = await householdRepository.findById(householdId);
    if (!household) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Household not found'
      });
    }

    // Check if user is an admin of the household
    const membership = await householdRepository.getUserMembership(householdId, userId);
    if (!membership) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    if (membership.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Not admin'
      });
    }

    // Build update data
    const updateData = { updatedBy: userId };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (timezone !== undefined) updateData.timezone = timezone;

    const updated = await householdRepository.update(householdId, updateData);

    // Log activity
    await activityLogRepository.log({
      householdId: updated.id,
      userId,
      action: 'household.updated',
      entityType: 'household',
      entityId: updated.id,
      entityName: updated.name,
      metadata: { changes: { name, description, timezone } },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      id: updated.id,
      name: updated.name,
      description: updated.description || '',
      timezone: updated.timezone || 'UTC',
      updatedAt: updated.updatedAt.toISOString(),
      updatedBy: userId
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.id, userId: req.user?.id }, 'Failed to update household');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while updating household'
    });
  }
});

// POST /api/v1/households/:householdId/invitations/:invitationId/accept - Accept invitation
router.post('/:householdId/invitations/:invitationId/accept', async (req, res) => {
  try {
    const userId = req.user.id;
    const { householdId, invitationId } = req.params;

    // Get current user
    const currentUser = await userRepository.findById(userId);
    if (!currentUser) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      });
    }

    // Find the invitation
    const invitation = await invitationRepository.findById(invitationId);
    if (!invitation || invitation.householdId !== householdId || invitation.status !== 'pending') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Invitation not found or expired'
      });
    }

    // Check if the invitation is for the current user
    if (currentUser.normalizedEmail !== invitation.email.toLowerCase()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This invitation is not for you'
      });
    }

    // Check if user is already a member
    const existingMembership = await householdRepository.getUserMembership(householdId, userId);
    if (existingMembership) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Already a member of this household'
      });
    }

    // Accept the invitation (adds user to household)
    const household = await invitationRepository.acceptInvitation(invitationId, userId);

    // Log activity
    await activityLogRepository.logMemberJoined(household, currentUser, invitation.role, invitation.invitedBy, req);

    res.status(200).json({
      message: 'Successfully joined household',
      householdId,
      role: invitation.role
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.householdId, invitationId: req.params.invitationId, userId: req.user?.id }, 'Failed to accept invitation');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while accepting invitation'
    });
  }
});

// POST /api/v1/households/:id/members - Invite member to household
router.post('/:id/members', async (req, res) => {
  try {
    const userId = req.user.id;
    const householdId = req.params.id;
    const { email, role } = req.body;

    // Validate required fields
    if (!email || !role) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and role are required'
      });
    }

    // Validate role
    if (!['admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid role. Must be admin, member, or viewer'
      });
    }

    // Find the household
    const household = await householdRepository.findById(householdId);
    if (!household) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Household not found'
      });
    }

    // Check if user is an admin of the household
    const membership = await householdRepository.getUserMembership(householdId, userId);
    if (!membership) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    if (membership.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Not admin'
      });
    }

    // Check if the email corresponds to an existing user who is already a member
    const invitedUser = await userRepository.findByEmail(email);
    if (invitedUser) {
      const existingMembership = await householdRepository.getUserMembership(householdId, invitedUser.id);
      if (existingMembership) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'User already member'
        });
      }
    }

    // Check for existing pending invitation
    const pendingInvitations = await invitationRepository.findPendingByEmail(email);
    const existingInvitation = pendingInvitations.find(inv => inv.householdId === householdId);
    if (existingInvitation) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User already member'
      });
    }

    // Create invitation
    const invitation = await invitationRepository.createInvitation(householdId, email, role, userId);

    res.status(201).json({
      invitationId: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt.toISOString()
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.id, email: maskEmail(req.body?.email), userId: req.user?.id }, 'Failed to invite member to household');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while inviting member'
    });
  }
});

module.exports = router;
