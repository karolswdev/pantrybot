/**
 * Tests for Base Repository
 */

const BaseRepository = require('../../repositories/baseRepository');

describe('BaseRepository', () => {
  let mockPrisma;
  let mockModel;
  let repository;

  beforeEach(() => {
    // Create mock model with all Prisma methods
    mockModel = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
    };

    // Create mock Prisma client
    mockPrisma = {
      testModel: mockModel,
      $transaction: jest.fn(),
    };

    repository = new BaseRepository(mockPrisma, 'testModel');
  });

  describe('constructor', () => {
    it('should set prisma client and model', () => {
      expect(repository.prisma).toBe(mockPrisma);
      expect(repository.model).toBe(mockModel);
      expect(repository.modelName).toBe('testModel');
    });
  });

  describe('findById', () => {
    it('should call findUnique with id', async () => {
      mockModel.findUnique.mockResolvedValue({ id: '123', name: 'Test' });

      const result = await repository.findById('123');

      expect(mockModel.findUnique).toHaveBeenCalledWith({ where: { id: '123' } });
      expect(result).toEqual({ id: '123', name: 'Test' });
    });

    it('should pass additional options', async () => {
      mockModel.findUnique.mockResolvedValue({ id: '123' });

      await repository.findById('123', { include: { relation: true } });

      expect(mockModel.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
        include: { relation: true },
      });
    });

    it('should return null when not found', async () => {
      mockModel.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findFirst', () => {
    it('should call findFirst with where clause', async () => {
      mockModel.findFirst.mockResolvedValue({ id: '123', email: 'test@test.com' });

      const result = await repository.findFirst({ email: 'test@test.com' });

      expect(mockModel.findFirst).toHaveBeenCalledWith({ where: { email: 'test@test.com' } });
      expect(result).toEqual({ id: '123', email: 'test@test.com' });
    });

    it('should pass additional options', async () => {
      mockModel.findFirst.mockResolvedValue({ id: '123' });

      await repository.findFirst({ active: true }, { orderBy: { createdAt: 'desc' } });

      expect(mockModel.findFirst).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findMany', () => {
    it('should call findMany with where clause', async () => {
      const items = [{ id: '1' }, { id: '2' }];
      mockModel.findMany.mockResolvedValue(items);

      const result = await repository.findMany({ active: true });

      expect(mockModel.findMany).toHaveBeenCalledWith({ where: { active: true } });
      expect(result).toEqual(items);
    });

    it('should default to empty where clause', async () => {
      mockModel.findMany.mockResolvedValue([]);

      await repository.findMany();

      expect(mockModel.findMany).toHaveBeenCalledWith({ where: {} });
    });

    it('should pass additional options like pagination', async () => {
      mockModel.findMany.mockResolvedValue([]);

      await repository.findMany({}, { skip: 10, take: 20, orderBy: { name: 'asc' } });

      expect(mockModel.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 10,
        take: 20,
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('create', () => {
    it('should call create with data', async () => {
      const newItem = { id: '123', name: 'New Item' };
      mockModel.create.mockResolvedValue(newItem);

      const result = await repository.create({ name: 'New Item' });

      expect(mockModel.create).toHaveBeenCalledWith({ data: { name: 'New Item' } });
      expect(result).toEqual(newItem);
    });

    it('should pass additional options', async () => {
      mockModel.create.mockResolvedValue({ id: '123' });

      await repository.create({ name: 'Test' }, { include: { relation: true } });

      expect(mockModel.create).toHaveBeenCalledWith({
        data: { name: 'Test' },
        include: { relation: true },
      });
    });
  });

  describe('createMany', () => {
    it('should call createMany with data array', async () => {
      const data = [{ name: 'Item 1' }, { name: 'Item 2' }];
      mockModel.createMany.mockResolvedValue({ count: 2 });

      const result = await repository.createMany(data);

      expect(mockModel.createMany).toHaveBeenCalledWith({ data });
      expect(result).toEqual({ count: 2 });
    });

    it('should pass additional options', async () => {
      const data = [{ name: 'Test' }];
      mockModel.createMany.mockResolvedValue({ count: 1 });

      await repository.createMany(data, { skipDuplicates: true });

      expect(mockModel.createMany).toHaveBeenCalledWith({
        data,
        skipDuplicates: true,
      });
    });
  });

  describe('update', () => {
    it('should call update with id and data', async () => {
      const updated = { id: '123', name: 'Updated' };
      mockModel.update.mockResolvedValue(updated);

      const result = await repository.update('123', { name: 'Updated' });

      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { name: 'Updated' },
      });
      expect(result).toEqual(updated);
    });

    it('should pass additional options', async () => {
      mockModel.update.mockResolvedValue({ id: '123' });

      await repository.update('123', { name: 'Test' }, { include: { relation: true } });

      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { name: 'Test' },
        include: { relation: true },
      });
    });
  });

  describe('updateMany', () => {
    it('should call updateMany with where and data', async () => {
      mockModel.updateMany.mockResolvedValue({ count: 5 });

      const result = await repository.updateMany({ active: false }, { active: true });

      expect(mockModel.updateMany).toHaveBeenCalledWith({
        where: { active: false },
        data: { active: true },
      });
      expect(result).toEqual({ count: 5 });
    });
  });

  describe('delete', () => {
    it('should call delete with id', async () => {
      const deleted = { id: '123', name: 'Deleted' };
      mockModel.delete.mockResolvedValue(deleted);

      const result = await repository.delete('123');

      expect(mockModel.delete).toHaveBeenCalledWith({ where: { id: '123' } });
      expect(result).toEqual(deleted);
    });
  });

  describe('deleteMany', () => {
    it('should call deleteMany with where clause', async () => {
      mockModel.deleteMany.mockResolvedValue({ count: 3 });

      const result = await repository.deleteMany({ expired: true });

      expect(mockModel.deleteMany).toHaveBeenCalledWith({ where: { expired: true } });
      expect(result).toEqual({ count: 3 });
    });
  });

  describe('count', () => {
    it('should call count with where clause', async () => {
      mockModel.count.mockResolvedValue(42);

      const result = await repository.count({ active: true });

      expect(mockModel.count).toHaveBeenCalledWith({ where: { active: true } });
      expect(result).toBe(42);
    });

    it('should default to empty where clause', async () => {
      mockModel.count.mockResolvedValue(100);

      const result = await repository.count();

      expect(mockModel.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toBe(100);
    });
  });

  describe('upsert', () => {
    it('should call upsert with where, create, and update', async () => {
      mockModel.upsert.mockResolvedValue({ id: '123', email: 'test@test.com' });

      const result = await repository.upsert(
        { email: 'test@test.com' },
        { email: 'test@test.com', name: 'New User' },
        { name: 'Updated User' }
      );

      expect(mockModel.upsert).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
        create: { email: 'test@test.com', name: 'New User' },
        update: { name: 'Updated User' },
      });
      expect(result).toEqual({ id: '123', email: 'test@test.com' });
    });

    it('should pass additional options', async () => {
      mockModel.upsert.mockResolvedValue({ id: '123' });

      await repository.upsert(
        { id: '123' },
        { id: '123', name: 'New' },
        { name: 'Updated' },
        { include: { relation: true } }
      );

      expect(mockModel.upsert).toHaveBeenCalledWith({
        where: { id: '123' },
        create: { id: '123', name: 'New' },
        update: { name: 'Updated' },
        include: { relation: true },
      });
    });
  });

  describe('transaction', () => {
    it('should call prisma.$transaction with callback', async () => {
      const callback = jest.fn().mockResolvedValue('result');
      mockPrisma.$transaction.mockImplementation((cb) => cb());

      await repository.transaction(callback);

      expect(mockPrisma.$transaction).toHaveBeenCalledWith(callback);
    });

    it('should return transaction result', async () => {
      const callback = jest.fn();
      mockPrisma.$transaction.mockResolvedValue('transaction-result');

      const result = await repository.transaction(callback);

      expect(result).toBe('transaction-result');
    });
  });
});
