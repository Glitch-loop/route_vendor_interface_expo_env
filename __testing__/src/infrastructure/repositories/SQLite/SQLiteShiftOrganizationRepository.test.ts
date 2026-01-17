import { container } from '@/src/infrastructure/di/container';
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';
import { SQLiteShiftOrganizationRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteShiftOrganizationRepository';
import { WorkDayInformation } from '@/src/core/entities/WorkDayInformation';
import { DayOperation } from '@/src/core/entities/DayOperation';
import { ShiftDayOperations } from '@/src/core/enums/ShiftDayOperations';
import { TOKENS } from '@/src/infrastructure/di/tokens';
import EMBEDDED_TABLES from '@/src/infrastructure/database/embeddedTables';

// Enable decorators metadata required by tsyringe
import 'reflect-metadata';

describe('SQLiteShiftOrganizationRepository', () => {
  let shiftOrganizationRepository: SQLiteShiftOrganizationRepository;
  let dataSource: SQLiteDataSource;

  beforeAll(async () => {
    dataSource = container.resolve<SQLiteDataSource>(TOKENS.SQLiteDataSource);
    await dataSource.initialize();
    const db = dataSource.getClient();
    await db.execAsync(`
      DROP TABLE IF EXISTS ${EMBEDDED_TABLES.ROUTE_DAY};
      CREATE TABLE IF NOT EXISTS ${EMBEDDED_TABLES.ROUTE_DAY} (
        id_work_day       TEXT NOT NULL UNIQUE,
        start_date        TEXT UNIQUE NOT NULL,
        end_date          TEXT,
        start_petty_cash  NUMERIC(6,3) NOT NULL UNIQUE,
        end_petty_cash    NUMERIC(6,3),
        id_route          TEXT NOT NULL UNIQUE,
        route_name        TEXT NOT NULL UNIQUE,
        description       TEXT,
        route_status      TEXT NOT NULL UNIQUE,
        id_day            TEXT NOT NULL UNIQUE,
        id_route_day      TEXT NOT NULL UNIQUE
      );
      DROP TABLE IF EXISTS ${EMBEDDED_TABLES.DAY_OPERATIONS};
      CREATE TABLE IF NOT EXISTS ${EMBEDDED_TABLES.DAY_OPERATIONS} (
        id_day_operation    TEXT NOT NULL UNIQUE,
        id_item             TEXT NOT NULL UNIQUE,
        operation_type      TEXT NOT NULL,
        created_at          DATETIME NOT NULL
      );
    `);
    shiftOrganizationRepository = container.resolve<SQLiteShiftOrganizationRepository>(
      TOKENS.SQLiteShiftOrganizationRepository
    );
  });

  describe('insertWorkDay', () => {
    it('should insert a work day successfully', () => {
      const workDay = new WorkDayInformation(
        'work-day-test-001',
        new Date('2024-01-15T08:00:00Z'),
        null,
        1000.0,
        null,
        'route-001',
        'Main Route',
        'Test route description',
        'active',
        'day-001',
        'route-day-001'
      );

      expect(() => shiftOrganizationRepository.insertWorkDay(workDay)).not.toThrow();

      // Cleanup
      shiftOrganizationRepository.deleteWorkDay(workDay);
    });
  });

  describe('updateWorkDay', () => {
    it('should update an existing work day', () => {
      const workDay = new WorkDayInformation(
        'work-day-update-001',
        new Date('2024-01-15T08:00:00Z'),
        null,
        1000.0,
        null,
        'route-002',
        'Secondary Route',
        'Test route update',
        'active',
        'day-002',
        'route-day-002'
      );

      shiftOrganizationRepository.insertWorkDay(workDay);

      const updatedWorkDay = new WorkDayInformation(
        'work-day-update-001',
        new Date('2024-01-15T08:00:00Z'),
        new Date('2024-01-15T18:00:00Z'),
        1000.0,
        1250.0,
        'route-002',
        'Secondary Route',
        'Test route updated',
        'completed',
        'day-002',
        'route-day-002'
      );

      expect(() => shiftOrganizationRepository.updateWorkDay(updatedWorkDay)).not.toThrow();

      // Cleanup
      shiftOrganizationRepository.deleteWorkDay(updatedWorkDay);
    });
  });

  describe('listWorkDays', () => {
    it('should list all work days', () => {
      const workDays = shiftOrganizationRepository.listWorkDays();
      expect(Array.isArray(workDays)).toBe(true);
    });
  });

  describe('deleteWorkDay', () => {
    it('should delete a work day', () => {
      const workDay = new WorkDayInformation(
        'work-day-delete-001',
        new Date('2024-01-15T08:00:00Z'),
        null,
        1000.0,
        null,
        'route-003',
        'Delete Test Route',
        'To be deleted',
        'active',
        'day-003',
        'route-day-003'
      );

      shiftOrganizationRepository.insertWorkDay(workDay);
      expect(() => shiftOrganizationRepository.deleteWorkDay(workDay)).not.toThrow();

      const allWorkDays = shiftOrganizationRepository.listWorkDays();
      const deleted = allWorkDays.find(w => w.id_work_day === 'work-day-delete-001');
      expect(deleted).toBeUndefined();
    });
  });

  describe('insertDayOperations', () => {
    it('should insert multiple day operations', () => {
      const dayOperations: DayOperation[] = [
        new DayOperation(
          'operation-001',
          'item-001',
          ShiftDayOperations.INVENTORY_OPERATION,
          new Date('2024-01-15T09:00:00Z')
        ),
        new DayOperation(
          'operation-002',
          'item-002',
          ShiftDayOperations.ROUTE_TRANSACTION,
          new Date('2024-01-15T10:00:00Z')
        ),
        new DayOperation(
          'operation-003',
          'item-003',
          ShiftDayOperations.NEW_CLIENT_REGISTRATION,
          new Date('2024-01-15T11:00:00Z')
        )
      ];

      expect(() => shiftOrganizationRepository.insertDayOperations(dayOperations)).not.toThrow();

      // Cleanup
      shiftOrganizationRepository.deleteAllDayOperations(dayOperations);
    });
  });

  describe('updateDayOperation', () => {
    it('should update a day operation', () => {
      const dayOperation = new DayOperation(
        'operation-update-001',
        'item-update-001',
        ShiftDayOperations.ROUTE_CLIENT_ATTENTION,
        new Date('2024-01-15T12:00:00Z')
      );

      shiftOrganizationRepository.insertDayOperations([dayOperation]);

      const updatedOperation = new DayOperation(
        'operation-update-001',
        'item-update-002',
        ShiftDayOperations.ATTEND_CLIENT_PETITION,
        new Date('2024-01-15T13:00:00Z')
      );

      expect(() => shiftOrganizationRepository.updateDayOperation(updatedOperation)).not.toThrow();

      // Cleanup
      shiftOrganizationRepository.deleteAllDayOperations([updatedOperation]);
    });
  });

  describe('listDayOperations', () => {
    it('should list all day operations', () => {
      const operations = shiftOrganizationRepository.listDayOperations();
      expect(Array.isArray(operations)).toBe(true);
    });
  });

  describe('deleteAllDayOperations', () => {
    it('should delete multiple day operations', () => {
      const dayOperations: DayOperation[] = [
        new DayOperation(
          'operation-delete-001',
          'item-delete-001',
          ShiftDayOperations.INVENTORY_OPERATION,
          new Date('2024-01-15T14:00:00Z')
        ),
        new DayOperation(
          'operation-delete-002',
          'item-delete-002',
          ShiftDayOperations.ROUTE_TRANSACTION,
          new Date('2024-01-15T15:00:00Z')
        )
      ];

      shiftOrganizationRepository.insertDayOperations(dayOperations);
      
      expect(() => shiftOrganizationRepository.deleteAllDayOperations(dayOperations)).not.toThrow();

      const remaining = shiftOrganizationRepository.listDayOperations();
      const deleted = remaining.filter(
        op => op.id_day_operation === 'operation-delete-001' || op.id_day_operation === 'operation-delete-002'
      );
      expect(deleted.length).toBe(0);
    });
  });
});
