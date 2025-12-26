const BaseRepository = require('./baseRepository');

class UserRepository extends BaseRepository {
  constructor(prisma) {
    super(prisma, 'user');
  }

  async findByEmail(email) {
    return this.model.findFirst({
      where: { normalizedEmail: email.toLowerCase() }
    });
  }

  async findByIdWithHouseholds(id) {
    return this.model.findUnique({
      where: { id },
      include: {
        householdMemberships: {
          include: {
            household: true
          }
        }
      }
    });
  }

  async createWithDefaultHousehold(userData) {
    return this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: userData.email,
          normalizedEmail: userData.email.toLowerCase(),
          passwordHash: userData.passwordHash,
          displayName: userData.displayName,
          timezone: userData.timezone || 'UTC'
        }
      });

      // Create default household
      const household = await tx.household.create({
        data: {
          name: `${userData.displayName || 'My'}'s Home`,
          description: 'Default household',
          createdBy: user.id
        }
      });

      // Add user as admin
      await tx.householdMember.create({
        data: {
          householdId: household.id,
          userId: user.id,
          role: 'admin'
        }
      });

      // Create default notification preferences
      await tx.notificationPreference.create({
        data: {
          userId: user.id,
          emailAddress: user.email
        }
      });

      return { user, household };
    });
  }

  async updateLastLogin(id) {
    return this.model.update({
      where: { id },
      data: { lastLoginAt: new Date() }
    });
  }
}

module.exports = UserRepository;
