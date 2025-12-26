const BaseRepository = require('./baseRepository');

class ShoppingListRepository extends BaseRepository {
  constructor(prisma) {
    super(prisma, 'shoppingList');
  }

  async findByHousehold(householdId) {
    return this.model.findMany({
      where: { householdId },
      include: {
        creator: {
          select: { id: true, displayName: true }
        },
        _count: {
          select: { items: true }
        },
        items: {
          where: { completed: true },
          select: { id: true }
        }
      },
      orderBy: { lastUpdated: 'desc' }
    });
  }

  async findByIdWithItems(id) {
    return this.model.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, displayName: true }
        },
        items: {
          orderBy: [
            { completed: 'asc' },
            { addedAt: 'desc' }
          ],
          include: {
            adder: {
              select: { id: true, displayName: true }
            },
            completer: {
              select: { id: true, displayName: true }
            }
          }
        }
      }
    });
  }

  async createList(data, userId, userDisplayName) {
    return this.model.create({
      data: {
        ...data,
        createdBy: userId
      },
      include: {
        creator: {
          select: { id: true, displayName: true }
        }
      }
    });
  }

  async addItem(listId, householdId, itemData, userId, userDisplayName) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.shoppingListItem.create({
        data: {
          listId,
          householdId,
          ...itemData,
          addedBy: userId
        },
        include: {
          adder: {
            select: { id: true, displayName: true }
          }
        }
      });

      await tx.shoppingList.update({
        where: { id: listId },
        data: { lastUpdated: new Date() }
      });

      return item;
    });
  }

  async updateItem(itemId, data) {
    return this.prisma.shoppingListItem.update({
      where: { id: itemId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        adder: {
          select: { id: true, displayName: true }
        },
        completer: {
          select: { id: true, displayName: true }
        }
      }
    });
  }

  async markItemComplete(itemId, completed, userId) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.shoppingListItem.update({
        where: { id: itemId },
        data: {
          completed,
          completedBy: completed ? userId : null,
          completedAt: completed ? new Date() : null
        },
        include: {
          adder: { select: { id: true, displayName: true } },
          completer: { select: { id: true, displayName: true } }
        }
      });

      await tx.shoppingList.update({
        where: { id: item.listId },
        data: { lastUpdated: new Date() }
      });

      return item;
    });
  }

  async deleteItem(itemId) {
    return this.prisma.shoppingListItem.delete({
      where: { id: itemId }
    });
  }

  async getListItems(listId) {
    return this.prisma.shoppingListItem.findMany({
      where: { listId },
      orderBy: [
        { completed: 'asc' },
        { addedAt: 'desc' }
      ],
      include: {
        adder: { select: { id: true, displayName: true } },
        completer: { select: { id: true, displayName: true } }
      }
    });
  }
}

module.exports = ShoppingListRepository;
