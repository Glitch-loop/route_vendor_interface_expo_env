


import { inject, injectable } from 'tsyringe';
import * as FileSystem from 'expo-file-system/legacy';

import { TOKENS } from '@/src/infrastructure/di/tokens';
import { SyncInventoryOperationRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncInventoryOperationRepository';
import { SyncRouteTransactionRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncRouteTransactionRepository';
import { SyncStoreRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncStoreRepository';
import { SyncWorkdayInformationRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncWorkdayInformationRepository';

type BackupRow = {
  phase_order: number;
  phase_name: string;
  entity_name: string;
  row_order: number;
  record_id: string;
  is_synced: number | string;
  is_deleted: number | string;
  updated_at: string;
  payload: string;
};

export type SheetBackupResult = {
  fileUri: string;
  fileName: string;
  totalRows: number;
};

@injectable()
export default class SheetBackupService {
  constructor(
    @inject(TOKENS.SyncInventoryOperationRepository)
    private readonly syncInventoryOpRepo: SyncInventoryOperationRepository,
    @inject(TOKENS.SyncRouteTransactionRepository)
    private readonly syncRouteTxRepo: SyncRouteTransactionRepository,
    @inject(TOKENS.SyncStoreRepository)
    private readonly syncStoreRepo: SyncStoreRepository,
    @inject(TOKENS.SyncWorkdayInformationRepository)
    private readonly syncWorkdayInfoRepo: SyncWorkdayInformationRepository,
  ) {}

  async createBackupSheetFile(): Promise<SheetBackupResult> {
    const rows: BackupRow[] = [];

    // Phase 1: Work day and stores
    const pendingWorkDays = await this.syncWorkdayInfoRepo.listPendingWorkdayInformationToSync();
    const pendingStores = await this.syncStoreRepo.listPendingStoreToSync();

    pendingWorkDays.forEach((record, index) => {
      rows.push(this.createBackupRow(1, 'workday_and_stores', 'workday_information', index + 1, record.id_work_day, record));
    });

    pendingStores.forEach((record, index) => {
      rows.push(this.createBackupRow(1, 'workday_and_stores', 'stores', pendingWorkDays.length + index + 1, record.id_store, record));
    });

    // Phase 2: Route transactions and inventory operations
    const pendingRouteTx = await this.syncRouteTxRepo.listPendingRouteTransactionToSync();
    const pendingInvOps = await this.syncInventoryOpRepo.listPendingInventoryOperationToSync();

    pendingRouteTx.forEach((record, index) => {
      rows.push(this.createBackupRow(2, 'transactions_and_inventory', 'route_transactions', index + 1, record.id_route_transaction, record));
    });

    pendingInvOps.forEach((record, index) => {
      rows.push(this.createBackupRow(2, 'transactions_and_inventory', 'inventory_operations', pendingRouteTx.length + index + 1, record.id_inventory_operation, record));
    });

    // Phase 3: Route transaction descriptions and inventory descriptions
    const pendingRouteTxDescs = await this.syncRouteTxRepo.listPendingRouteTransactionDescriptionToSync();
    const pendingInvOpDescs = await this.syncInventoryOpRepo.listPendingInventoryOperationDescriptionToSync();

    pendingRouteTxDescs.forEach((record, index) => {
      rows.push(this.createBackupRow(3, 'transaction_descriptions', 'route_transaction_descriptions', index + 1, record.id_route_transaction_description, record));
    });

    pendingInvOpDescs.forEach((record, index) => {
      rows.push(this.createBackupRow(3, 'transaction_descriptions', 'inventory_operation_descriptions', pendingRouteTxDescs.length + index + 1, record.id_inventory_operation_description, record));
    });

    rows.sort((a, b) => {
      if (a.phase_order !== b.phase_order) return a.phase_order - b.phase_order;
      return a.row_order - b.row_order;
    });

    const csv = this.buildCsv(rows);
    const directory = FileSystem.documentDirectory;

    if (!directory) {
      throw new Error('Could not access device document directory.');
    }

    const fileName = `twister_manual_backup_${this.getTimestampForFileName()}.csv`;
    const fileUri = `${directory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return {
      fileUri,
      fileName,
      totalRows: rows.length,
    };
  }

  private createBackupRow(
    phaseOrder: number,
    phaseName: string,
    entityName: string,
    rowOrder: number,
    recordId: string,
    payload: { is_synced?: number; is_deleted?: number; updated_at?: string },
  ): BackupRow {
    return {
      phase_order: phaseOrder,
      phase_name: phaseName,
      entity_name: entityName,
      row_order: rowOrder,
      record_id: recordId,
      is_synced: payload.is_synced ?? '',
      is_deleted: payload.is_deleted ?? '',
      updated_at: payload.updated_at ?? '',
      payload: JSON.stringify(payload),
    };
  }

  private buildCsv(rows: BackupRow[]): string {
    const headers = [
      'phase_order',
      'phase_name',
      'entity_name',
      'row_order',
      'record_id',
      'is_synced',
      'is_deleted',
      'updated_at',
      'payload',
    ];

    const lines = [headers.join(',')];

    rows.forEach((row) => {
      const values = [
        row.phase_order,
        row.phase_name,
        row.entity_name,
        row.row_order,
        row.record_id,
        row.is_synced,
        row.is_deleted,
        row.updated_at,
        row.payload,
      ].map((value) => this.escapeCsvValue(String(value)));

      lines.push(values.join(','));
    });

    return lines.join('\n');
  }

  private escapeCsvValue(value: string): string {
    const escapedValue = value.replace(/"/g, '""');
    return `"${escapedValue}"`;
  }

  private getTimestampForFileName(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }
}