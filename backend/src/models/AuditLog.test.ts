import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AuditLog } from './AuditLog';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clean up between tests without triggering the pre-hook guard
  await mongoose.connection.collections['auditlogs']?.drop().catch(() => {});
});

const validEntry = {
  actorId: new Types.ObjectId(),
  actorRole: 'admin',
  action: 'CREATE',
  resourceType: 'patients',
  resourceId: 'abc123',
  after: { name: 'John Doe' },
  ip: '127.0.0.1',
  userAgent: 'jest-test',
};

describe('AuditLog.create()', () => {
  it('succeeds with valid data', async () => {
    const doc = await AuditLog.create(validEntry);
    expect(doc._id).toBeDefined();
    expect(doc.actorRole).toBe('admin');
    expect(doc.action).toBe('CREATE');
    expect(doc.resourceType).toBe('patients');
    expect(doc.timestamp).toBeInstanceOf(Date);
  });

  it('stores before and after snapshots', async () => {
    const doc = await AuditLog.create({
      ...validEntry,
      before: { status: 'inactive' },
      after: { status: 'active' },
    });
    expect(doc.before).toEqual({ status: 'inactive' });
    expect(doc.after).toEqual({ status: 'active' });
  });
});

describe('AuditLog append-only enforcement', () => {
  it('throws when calling updateOne on AuditLog', async () => {
    await AuditLog.create(validEntry);
    await expect(
      AuditLog.updateOne({ action: 'CREATE' }, { $set: { action: 'TAMPERED' } })
    ).rejects.toThrow('AuditLog is append-only');
  });

  it('throws when calling deleteOne on AuditLog', async () => {
    await AuditLog.create(validEntry);
    await expect(
      AuditLog.deleteOne({ action: 'CREATE' })
    ).rejects.toThrow('AuditLog is append-only');
  });

  it('throws when calling updateMany on AuditLog', async () => {
    await AuditLog.create(validEntry);
    await expect(
      AuditLog.updateMany({}, { $set: { action: 'TAMPERED' } })
    ).rejects.toThrow('AuditLog is append-only');
  });

  it('throws when calling deleteMany on AuditLog', async () => {
    await AuditLog.create(validEntry);
    await expect(
      AuditLog.deleteMany({})
    ).rejects.toThrow('AuditLog is append-only');
  });

  it('throws when calling replaceOne on AuditLog', async () => {
    await AuditLog.create(validEntry);
    await expect(
      AuditLog.replaceOne({ action: 'CREATE' }, validEntry)
    ).rejects.toThrow('AuditLog is append-only');
  });

  it('throws when calling bulkWrite on AuditLog', async () => {
    await AuditLog.create(validEntry);
    await expect(
      AuditLog.bulkWrite([{ deleteOne: { filter: { action: 'CREATE' } } }])
    ).rejects.toThrow('AuditLog is append-only');
  });
});
