const BaseRepository = require('./baseRepository');

class InventoryRepository extends BaseRepository {
  constructor(prisma) {
    super(prisma, 'inventoryItem');
  }

  async findByHousehold(householdId, filters = {}) {
    const where = { householdId };

    if (filters.location && filters.location !== 'all') {
      where.location = filters.location;
    }
    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { category: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    if (filters.status) {
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      switch (filters.status) {
        case 'fresh':
          where.OR = [
            { expirationDate: null },
            { expirationDate: { gt: weekFromNow } }
          ];
          break;
        case 'expiring':
          where.expirationDate = { gte: now, lte: weekFromNow };
          break;
        case 'expired':
          where.expirationDate = { lt: now };
          break;
        case 'no_expiry':
          where.expirationDate = null;
          break;
      }
    }

    return this.model.findMany({
      where,
      orderBy: [
        { expirationDate: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        creator: {
          select: { id: true, displayName: true }
        }
      }
    });
  }

  async findExpiringItems(householdId, days = 7) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.model.findMany({
      where: {
        householdId,
        expirationDate: {
          gte: now,
          lte: futureDate
        }
      },
      orderBy: { expirationDate: 'asc' }
    });
  }

  async findExpiredItems(householdId) {
    return this.model.findMany({
      where: {
        householdId,
        expirationDate: { lt: new Date() }
      },
      orderBy: { expirationDate: 'asc' }
    });
  }

  async findByIdWithHistory(id) {
    return this.model.findUnique({
      where: { id },
      include: {
        histories: {
          orderBy: { timestamp: 'desc' },
          take: 20,
          include: {
            user: {
              select: { id: true, displayName: true }
            }
          }
        },
        creator: {
          select: { id: true, displayName: true }
        }
      }
    });
  }

  async createWithHistory(itemData, userId) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.create({
        data: itemData,
        include: {
          creator: {
            select: { id: true, displayName: true }
          }
        }
      });

      await tx.itemHistory.create({
        data: {
          itemId: item.id,
          householdId: item.householdId,
          action: 'created',
          notes: `Item "${item.name}" added to inventory`,
          newLocation: item.location,
          userId
        }
      });

      return item;
    });
  }

  async updateWithVersionCheck(id, data, currentVersion, userId) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.inventoryItem.findUnique({ where: { id } });

      if (!current) {
        return { error: 'not_found' };
      }

      if (current.rowVersion !== currentVersion) {
        return { conflict: true, currentState: current };
      }

      const updated = await tx.inventoryItem.update({
        where: { id },
        data: {
          ...data,
          rowVersion: { increment: 1 },
          updatedBy: userId
        },
        include: {
          creator: { select: { id: true, displayName: true } }
        }
      });

      await tx.itemHistory.create({
        data: {
          itemId: id,
          householdId: current.householdId,
          action: 'updated',
          notes: `Item "${current.name}" updated`,
          previousLocation: data.location !== current.location ? current.location : null,
          newLocation: data.location !== current.location ? data.location : null,
          userId
        }
      });

      return { conflict: false, item: updated };
    });
  }

  async consumeItem(id, quantity, userId, notes) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id } });
      if (!item) throw new Error('Item not found');

      const remainingQuantity = Number(item.quantity) - quantity;

      await tx.itemHistory.create({
        data: {
          itemId: id,
          householdId: item.householdId,
          action: 'consumed',
          quantity,
          notes: notes || `Consumed ${quantity} ${item.unit} of "${item.name}"`,
          userId
        }
      });

      if (remainingQuantity <= 0) {
        await tx.inventoryItem.delete({ where: { id } });
        return { deleted: true, remainingQuantity: 0 };
      }

      const updated = await tx.inventoryItem.update({
        where: { id },
        data: {
          quantity: remainingQuantity,
          rowVersion: { increment: 1 }
        }
      });

      return { deleted: false, remainingQuantity, item: updated };
    });
  }

  async wasteItem(id, quantity, reason, userId, notes) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id } });
      if (!item) throw new Error('Item not found');

      const remainingQuantity = Number(item.quantity) - quantity;

      await tx.itemHistory.create({
        data: {
          itemId: id,
          householdId: item.householdId,
          action: 'wasted',
          quantity,
          reason,
          notes: notes || `Wasted ${quantity} ${item.unit} of "${item.name}"`,
          userId
        }
      });

      if (remainingQuantity <= 0) {
        await tx.inventoryItem.delete({ where: { id } });
        return { deleted: true, remainingQuantity: 0 };
      }

      const updated = await tx.inventoryItem.update({
        where: { id },
        data: {
          quantity: remainingQuantity,
          rowVersion: { increment: 1 }
        }
      });

      return { deleted: false, remainingQuantity, item: updated };
    });
  }

  async deleteWithHistory(id, userId) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id } });
      if (!item) return null;

      await tx.itemHistory.create({
        data: {
          itemId: id,
          householdId: item.householdId,
          action: 'deleted',
          notes: `Item "${item.name}" deleted`,
          userId
        }
      });

      await tx.inventoryItem.delete({ where: { id } });
      return item;
    });
  }
}

module.exports = InventoryRepository;
