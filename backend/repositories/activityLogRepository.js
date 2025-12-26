const BaseRepository = require('./baseRepository');

class ActivityLogRepository extends BaseRepository {
  constructor(prisma) {
    super(prisma, 'activityLog');
  }

  async log(params) {
    const {
      householdId,
      userId,
      action,
      entityType,
      entityId,
      entityName,
      metadata = {},
      ipAddress,
      userAgent
    } = params;

    return this.model.create({
      data: {
        householdId,
        userId,
        action,
        entityType,
        entityId,
        entityName,
        metadata,
        ipAddress,
        userAgent
      }
    });
  }

  async findByHousehold(householdId, options = {}) {
    const { limit = 20, offset = 0 } = options;

    const [activities, total] = await Promise.all([
      this.model.findMany({
        where: { householdId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: { id: true, displayName: true, email: true }
          }
        }
      }),
      this.model.count({ where: { householdId } })
    ]);

    return {
      activities,
      total,
      hasMore: offset + activities.length < total
    };
  }

  async findByUser(userId, options = {}) {
    const { limit = 20, offset = 0 } = options;

    return this.model.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        household: {
          select: { id: true, name: true }
        }
      }
    });
  }

  async findByEntity(entityType, entityId, options = {}) {
    const { limit = 50 } = options;

    return this.model.findMany({
      where: { entityType, entityId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, displayName: true }
        }
      }
    });
  }

  // Convenience methods for common activity types
  async logItemCreated(item, userId, req) {
    return this.log({
      householdId: item.householdId,
      userId,
      action: 'item.created',
      entityType: 'inventory_item',
      entityId: item.id,
      entityName: item.name,
      metadata: {
        location: item.location,
        quantity: Number(item.quantity),
        unit: item.unit
      },
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent']
    });
  }

  async logItemUpdated(item, changes, userId, req) {
    return this.log({
      householdId: item.householdId,
      userId,
      action: 'item.updated',
      entityType: 'inventory_item',
      entityId: item.id,
      entityName: item.name,
      metadata: { changes },
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent']
    });
  }

  async logItemConsumed(item, quantity, userId, req) {
    return this.log({
      householdId: item.householdId,
      userId,
      action: 'item.consumed',
      entityType: 'inventory_item',
      entityId: item.id,
      entityName: item.name,
      metadata: { quantity, unit: item.unit },
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent']
    });
  }

  async logItemWasted(item, quantity, reason, userId, req) {
    return this.log({
      householdId: item.householdId,
      userId,
      action: 'item.wasted',
      entityType: 'inventory_item',
      entityId: item.id,
      entityName: item.name,
      metadata: { quantity, unit: item.unit, reason },
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent']
    });
  }

  async logItemDeleted(item, userId, req) {
    return this.log({
      householdId: item.householdId,
      userId,
      action: 'item.deleted',
      entityType: 'inventory_item',
      entityId: item.id,
      entityName: item.name,
      metadata: {},
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent']
    });
  }

  async logMemberJoined(household, user, role, inviterId, req) {
    return this.log({
      householdId: household.id,
      userId: user.id,
      action: 'member.joined',
      entityType: 'user',
      entityId: user.id,
      entityName: user.displayName || user.email,
      metadata: { role, invitedBy: inviterId },
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent']
    });
  }

  async logMemberLeft(household, user, req) {
    return this.log({
      householdId: household.id,
      userId: user.id,
      action: 'member.left',
      entityType: 'user',
      entityId: user.id,
      entityName: user.displayName || user.email,
      metadata: {},
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent']
    });
  }

  async logShoppingListCreated(list, userId, req) {
    return this.log({
      householdId: list.householdId,
      userId,
      action: 'shopping_list.created',
      entityType: 'shopping_list',
      entityId: list.id,
      entityName: list.name,
      metadata: {},
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent']
    });
  }

  async logShoppingListItemAdded(list, item, userId, req) {
    return this.log({
      householdId: list.householdId,
      userId,
      action: 'shopping_list.item_added',
      entityType: 'shopping_list',
      entityId: list.id,
      entityName: list.name,
      metadata: { itemName: item.name, quantity: item.quantity },
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent']
    });
  }

  async logShoppingListItemCompleted(list, item, userId, req) {
    return this.log({
      householdId: list.householdId,
      userId,
      action: 'shopping_list.item_completed',
      entityType: 'shopping_list',
      entityId: list.id,
      entityName: list.name,
      metadata: { itemName: item.name },
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent']
    });
  }
}

module.exports = ActivityLogRepository;
