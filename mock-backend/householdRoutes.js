const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('./authMiddleware');
const { users, households, household_members, invitations } = require('./db');

const router = express.Router();

// Apply authentication middleware to all household routes
router.use(authMiddleware);

// GET /api/v1/households - List user's households
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;

    // Find all household memberships for the user
    const userMemberships = household_members.filter(hm => hm.userId === userId);

    // Get full household details for each membership
    const userHouseholds = userMemberships.map(membership => {
      const household = households.find(h => h.id === membership.householdId);
      
      // Count members and items (mocked)
      const memberCount = household_members.filter(hm => hm.householdId === membership.householdId).length;
      
      return {
        id: household.id,
        name: household.name,
        description: household.description || '',
        role: membership.role,
        memberCount: memberCount,
        itemCount: Math.floor(Math.random() * 200), // Mock data
        expiringItemCount: Math.floor(Math.random() * 10), // Mock data
        createdAt: household.createdAt.toISOString()
      };
    });

    res.status(200).json({
      households: userHouseholds,
      total: userHouseholds.length
    });
  } catch (error) {
    console.error('List households error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching households'
    });
  }
});

// POST /api/v1/households - Create new household
router.post('/', (req, res) => {
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

    // Create new household
    const householdId = uuidv4();
    const newHousehold = {
      id: householdId,
      name,
      description: description || '',
      timezone: timezone || 'UTC',
      createdBy: userId,
      createdAt: new Date()
    };
    households.push(newHousehold);

    // Add user as admin of the new household
    household_members.push({
      householdId,
      userId,
      role: 'admin',
      joinedAt: new Date()
    });

    // Return created household
    res.status(201).json({
      id: householdId,
      name: newHousehold.name,
      description: newHousehold.description,
      timezone: newHousehold.timezone,
      createdAt: newHousehold.createdAt.toISOString(),
      createdBy: userId
    });
  } catch (error) {
    console.error('Create household error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while creating household'
    });
  }
});

// GET /api/v1/households/:id - Get household details
router.get('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const householdId = req.params.id;

    // Find the household
    const household = households.find(h => h.id === householdId);
    if (!household) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Household not found'
      });
    }

    // Check if user is a member of the household
    const membership = household_members.find(
      hm => hm.householdId === householdId && hm.userId === userId
    );
    
    if (!membership) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    // Get all members of the household
    const householdMemberships = household_members.filter(hm => hm.householdId === householdId);
    const members = householdMemberships.map(hm => {
      const user = users.find(u => u.id === hm.userId);
      return {
        userId: hm.userId,
        email: user ? user.email : '',
        displayName: user ? user.displayName : '',
        role: hm.role,
        joinedAt: hm.joinedAt.toISOString()
      };
    });

    // Mock statistics
    const statistics = {
      totalItems: 127,
      expiringItems: 3,
      expiredItems: 1,
      consumedThisMonth: 45,
      wastedThisMonth: 5
    };

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
    console.error('Get household details error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching household details'
    });
  }
});

// PUT /api/v1/households/:id - Update household
router.put('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const householdId = req.params.id;
    const { name, description, timezone } = req.body;

    // Find the household
    const household = households.find(h => h.id === householdId);
    if (!household) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Household not found'
      });
    }

    // Check if user is an admin of the household
    const membership = household_members.find(
      hm => hm.householdId === householdId && hm.userId === userId
    );
    
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

    // Update household fields
    if (name !== undefined) household.name = name;
    if (description !== undefined) household.description = description;
    if (timezone !== undefined) household.timezone = timezone;
    household.updatedAt = new Date();
    household.updatedBy = userId;

    res.status(200).json({
      id: household.id,
      name: household.name,
      description: household.description || '',
      timezone: household.timezone || 'UTC',
      updatedAt: household.updatedAt.toISOString(),
      updatedBy: userId
    });
  } catch (error) {
    console.error('Update household error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while updating household'
    });
  }
});

// POST /api/v1/households/:householdId/invitations/:invitationId/accept - Accept invitation (mock endpoint for testing)
router.post('/:householdId/invitations/:invitationId/accept', (req, res) => {
  try {
    const userId = req.user.id;
    const { householdId, invitationId } = req.params;

    // Find the invitation
    const invitation = invitations.find(
      inv => inv.invitationId === invitationId && 
             inv.householdId === householdId &&
             inv.status === 'pending'
    );

    if (!invitation) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Invitation not found or expired'
      });
    }

    // Check if the invitation is for the current user
    const currentUser = users.find(u => u.id === userId);
    if (currentUser.email !== invitation.email) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This invitation is not for you'
      });
    }

    // Check if user is already a member
    const existingMembership = household_members.find(
      hm => hm.householdId === householdId && hm.userId === userId
    );

    if (existingMembership) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Already a member of this household'
      });
    }

    // Add user to household
    household_members.push({
      householdId,
      userId,
      role: invitation.role,
      joinedAt: new Date()
    });

    // Mark invitation as accepted
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = userId;

    res.status(200).json({
      message: 'Successfully joined household',
      householdId,
      role: invitation.role
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while accepting invitation'
    });
  }
});

// POST /api/v1/households/:id/members - Invite member to household
router.post('/:id/members', (req, res) => {
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
    const household = households.find(h => h.id === householdId);
    if (!household) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Household not found'
      });
    }

    // Check if user is an admin of the household
    const membership = household_members.find(
      hm => hm.householdId === householdId && hm.userId === userId
    );
    
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

    // Check if the email corresponds to an existing user
    const invitedUser = users.find(u => u.email === email);
    
    // If user exists, check if they're already a member
    if (invitedUser) {
      const existingMembership = household_members.find(
        hm => hm.householdId === householdId && hm.userId === invitedUser.id
      );
      
      if (existingMembership) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'User already member'
        });
      }
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = invitations.find(
      inv => inv.householdId === householdId && 
             inv.email === email && 
             inv.status === 'pending' &&
             inv.expiresAt > new Date()
    );

    if (existingInvitation) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User already member'
      });
    }

    // Create invitation
    const invitationId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const invitation = {
      invitationId,
      householdId,
      email,
      role,
      status: 'pending',
      createdBy: userId,
      createdAt: new Date(),
      expiresAt
    };

    invitations.push(invitation);

    // Return invitation details
    res.status(201).json({
      invitationId,
      email,
      role,
      status: 'pending',
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while inviting member'
    });
  }
});

module.exports = router;