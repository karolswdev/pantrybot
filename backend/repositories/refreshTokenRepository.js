const BaseRepository = require('./baseRepository');

class RefreshTokenRepository extends BaseRepository {
  constructor(prisma) {
    super(prisma, 'refreshToken');
  }

  async createToken(userId, token, expiresAt) {
    return this.model.create({
      data: {
        userId,
        token,
        expiresAt
      }
    });
  }

  async findValidToken(token) {
    return this.model.findFirst({
      where: {
        token,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: true
      }
    });
  }

  async revokeToken(token) {
    return this.model.updateMany({
      where: { token },
      data: { revokedAt: new Date() }
    });
  }

  async revokeAllUserTokens(userId) {
    return this.model.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: { revokedAt: new Date() }
    });
  }

  async rotateToken(oldToken, newToken, expiresAt) {
    return this.prisma.$transaction(async (tx) => {
      // Find and revoke old token
      const old = await tx.refreshToken.findFirst({
        where: {
          token: oldToken,
          revokedAt: null,
          expiresAt: { gt: new Date() }
        },
        include: { user: true }
      });

      if (!old) {
        return null;
      }

      await tx.refreshToken.update({
        where: { id: old.id },
        data: { revokedAt: new Date() }
      });

      // Create new token
      const created = await tx.refreshToken.create({
        data: {
          userId: old.userId,
          token: newToken,
          expiresAt
        }
      });

      return { refreshToken: created, user: old.user };
    });
  }

  async cleanupExpiredTokens() {
    return this.model.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } }
        ]
      }
    });
  }
}

module.exports = RefreshTokenRepository;
