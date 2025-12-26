const BaseRepository = require('./baseRepository');

class NotificationRepository extends BaseRepository {
  constructor(prisma) {
    super(prisma, 'notification');
  }

  async findUserNotifications(userId, options = {}) {
    const { limit = 50, offset = 0, unreadOnly = false } = options;

    const where = { userId };
    if (unreadOnly) {
      where.readAt = null;
    }

    const [notifications, total] = await Promise.all([
      this.model.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      this.model.count({ where })
    ]);

    return { notifications, total };
  }

  async getUnreadCount(userId) {
    return this.model.count({
      where: {
        userId,
        readAt: null,
        channel: 'in_app'
      }
    });
  }

  async markAsRead(id, userId) {
    return this.model.update({
      where: { id, userId },
      data: { readAt: new Date() }
    });
  }

  async markAllAsRead(userId) {
    return this.model.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() }
    });
  }

  async createNotification(data) {
    return this.model.create({ data });
  }

  async createManyNotifications(notifications) {
    return this.model.createMany({ data: notifications });
  }

  async getScheduledNotifications() {
    return this.model.findMany({
      where: {
        status: 'pending',
        scheduledFor: { lte: new Date() }
      },
      include: {
        user: {
          include: {
            notificationPreference: true
          }
        }
      }
    });
  }

  async updateNotificationStatus(id, status, error = null) {
    return this.model.update({
      where: { id },
      data: {
        status,
        sentAt: status === 'sent' ? new Date() : undefined,
        error
      }
    });
  }

  // Notification Preferences
  async getPreferences(userId) {
    return this.prisma.notificationPreference.findUnique({
      where: { userId }
    });
  }

  async upsertPreferences(userId, data) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data
    });
  }

  async linkTelegram(userId, chatId, username) {
    return this.prisma.notificationPreference.update({
      where: { userId },
      data: {
        telegramLinked: true,
        telegramChatId: chatId,
        telegramUsername: username
      }
    });
  }

  async unlinkTelegram(userId) {
    return this.prisma.notificationPreference.update({
      where: { userId },
      data: {
        telegramLinked: false,
        telegramChatId: null,
        telegramUsername: null
      }
    });
  }

  async findByTelegramChatId(chatId) {
    return this.prisma.notificationPreference.findFirst({
      where: { telegramChatId: chatId },
      include: { user: true }
    });
  }
}

module.exports = NotificationRepository;
