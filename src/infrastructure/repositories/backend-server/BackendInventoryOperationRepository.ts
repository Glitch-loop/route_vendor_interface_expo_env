// Libraries
import { injectable, inject } from 'tsyringe';

// Infrastructure
import { BackendDataSource } from '@/src/infrastructure/datasources/BackendDatasource';

// Interfaces
import { SyncServerInventoryOperationRepository } from '@/src/infrastructure/persitence/interface/server-database/SyncServerInventoryOperationRepository';

// Models
import InventoryOperationModel from '@/src/infrastructure/persitence/model/InventoryOperationModel';
import InventoryOperationDescriptionModel from '@/src/infrastructure/persitence/model/InventoryOperationDescriptionModel';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export class BackendInventoryOperationRepository implements SyncServerInventoryOperationRepository {
    constructor(@inject(TOKENS.BackendDataSource) private readonly dataSource: BackendDataSource) {}

    async upsertInventoryOperations(operations: InventoryOperationModel[]): Promise<void> {
    }

    async upsertInventoryOperationDescriptions(descriptions: InventoryOperationDescriptionModel[]): Promise<void> {
    }
}