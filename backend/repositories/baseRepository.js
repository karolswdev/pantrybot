/**
 * Base repository class with common CRUD operations
 */
class BaseRepository {
  constructor(prisma, modelName) {
    this.prisma = prisma;
    this.model = prisma[modelName];
    this.modelName = modelName;
  }

  async findById(id, options = {}) {
    return this.model.findUnique({ where: { id }, ...options });
  }

  async findFirst(where, options = {}) {
    return this.model.findFirst({ where, ...options });
  }

  async findMany(where = {}, options = {}) {
    return this.model.findMany({ where, ...options });
  }

  async create(data, options = {}) {
    return this.model.create({ data, ...options });
  }

  async createMany(data, options = {}) {
    return this.model.createMany({ data, ...options });
  }

  async update(id, data, options = {}) {
    return this.model.update({ where: { id }, data, ...options });
  }

  async updateMany(where, data, options = {}) {
    return this.model.updateMany({ where, data, ...options });
  }

  async delete(id) {
    return this.model.delete({ where: { id } });
  }

  async deleteMany(where) {
    return this.model.deleteMany({ where });
  }

  async count(where = {}) {
    return this.model.count({ where });
  }

  async upsert(where, create, update, options = {}) {
    return this.model.upsert({ where, create, update, ...options });
  }

  // Transaction helper
  async transaction(callback) {
    return this.prisma.$transaction(callback);
  }
}

module.exports = BaseRepository;
