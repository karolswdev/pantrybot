const BaseRepository = require('./baseRepository');

class HouseholdRepository extends BaseRepository {
  constructor(prisma) {
    super(prisma, 'household');
  }

  async findByIdWithMembers(id) {
    return this.model.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, displayName: true }
            }
          }
        }
      }
    });
  }

  async findUserHouseholds(userId) {
    const memberships = await this.prisma.householdMember.findMany({
      where: { userId },
      include: {
        household: {
          include: {
            _count: {
              select: {
                members: true,
                inventoryItems: true
              }
            }
          }
        }
      }
    });

    return memberships.map(m => ({
      ...m.household,
      role: m.role,
      memberCount: m.household._count.members,
      itemCount: m.household._count.inventoryItems
    }));
  }

  async getUserMembership(householdId, userId) {
    return this.prisma.householdMember.findUnique({
      where: {
        householdId_userId: { householdId, userId }
      }
    });
  }

  async addMember(householdId, userId, role = 'member') {
    return this.prisma.householdMember.create({
      data: { householdId, userId, role }
    });
  }

  async removeMember(householdId, userId) {
    return this.prisma.householdMember.delete({
      where: {
        householdId_userId: { householdId, userId }
      }
    });
  }

  async updateMemberRole(householdId, userId, role) {
    return this.prisma.householdMember.update({
      where: {
        householdId_userId: { householdId, userId }
      },
      data: { role }
    });
  }

  async getStatistics(householdId) {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalItems, expiringItems, expiredItems, consumedThisMonth, wastedThisMonth] = await Promise.all([
      this.prisma.inventoryItem.count({ where: { householdId } }),
      this.prisma.inventoryItem.count({
        where: {
          householdId,
          expirationDate: { gte: now, lte: weekFromNow }
        }
      }),
      this.prisma.inventoryItem.count({
        where: {
          householdId,
          expirationDate: { lt: now }
        }
      }),
      this.prisma.itemHistory.count({
        where: {
          householdId,
          action: 'consumed',
          timestamp: { gte: startOfMonth }
        }
      }),
      this.prisma.itemHistory.count({
        where: {
          householdId,
          action: 'wasted',
          timestamp: { gte: startOfMonth }
        }
      })
    ]);

    return {
      totalItems,
      expiringItems,
      expiredItems,
      consumedThisMonth,
      wastedThisMonth
    };
  }
}

module.exports = HouseholdRepository;
