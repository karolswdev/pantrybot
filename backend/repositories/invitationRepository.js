const BaseRepository = require('./baseRepository');

class InvitationRepository extends BaseRepository {
  constructor(prisma) {
    super(prisma, 'invitation');
  }

  async findByHousehold(householdId, status = null) {
    const where = { householdId };
    if (status) {
      where.status = status;
    }

    return this.model.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        inviter: {
          select: { id: true, displayName: true, email: true }
        }
      }
    });
  }

  async findPendingByEmail(email) {
    return this.model.findMany({
      where: {
        email: email.toLowerCase(),
        status: 'pending',
        expiresAt: { gt: new Date() }
      },
      include: {
        household: {
          select: { id: true, name: true }
        },
        inviter: {
          select: { id: true, displayName: true }
        }
      }
    });
  }

  async createInvitation(householdId, email, role, invitedBy) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

    return this.model.create({
      data: {
        householdId,
        email: email.toLowerCase(),
        role,
        invitedBy,
        expiresAt
      },
      include: {
        household: {
          select: { id: true, name: true }
        },
        inviter: {
          select: { id: true, displayName: true }
        }
      }
    });
  }

  async acceptInvitation(invitationId, userId) {
    return this.prisma.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({
        where: { id: invitationId },
        include: {
          household: true
        }
      });

      if (!invitation) {
        throw new Error('Invitation not found');
      }

      if (invitation.status !== 'pending') {
        throw new Error('Invitation is no longer pending');
      }

      if (invitation.expiresAt < new Date()) {
        await tx.invitation.update({
          where: { id: invitationId },
          data: { status: 'expired' }
        });
        throw new Error('Invitation has expired');
      }

      // Update invitation status
      await tx.invitation.update({
        where: { id: invitationId },
        data: {
          status: 'accepted',
          acceptedAt: new Date(),
          acceptedBy: userId
        }
      });

      // Add user to household
      await tx.householdMember.create({
        data: {
          householdId: invitation.householdId,
          userId,
          role: invitation.role
        }
      });

      return invitation.household;
    });
  }

  async declineInvitation(invitationId) {
    return this.model.update({
      where: { id: invitationId },
      data: { status: 'declined' }
    });
  }

  async expireOldInvitations() {
    return this.model.updateMany({
      where: {
        status: 'pending',
        expiresAt: { lt: new Date() }
      },
      data: { status: 'expired' }
    });
  }
}

module.exports = InvitationRepository;
