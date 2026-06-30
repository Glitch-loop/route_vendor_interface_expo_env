// Libraries
import { injectable, inject } from 'tsyringe';

// Infrastructure
import { BackendDataSource } from '@/src/infrastructure/datasources/BackendDatasource';

// Interfaces
import { SyncServerInventoryOperationRepository } from '@/src/infrastructure/persitence/interface/server-database/SyncServerInventoryOperationRepository';

// Models
import InventoryOperationServerModel from '@/src/infrastructure/persitence/model/server-models/InventoryOperationServerModel';
import InventoryOperationDescriptionModel from '@/src/infrastructure/persitence/model/server-models/InventoryOperationDescriptionServerModel';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export class BackendInventoryOperationRepository implements SyncServerInventoryOperationRepository {
    constructor(@inject(TOKENS.BackendDataSource) private readonly dataSource: BackendDataSource) {}

    async upsertInventoryOperations(operations: InventoryOperationServerModel[]): Promise<void> {
        if (!operations || operations.length === 0) return;

        try {
            await this.dataSource.post<unknown, InventoryOperationServerModel[]>(
                '/inventories/route',
                operations
            );
        } catch (error: any) {
            throw new Error(`Failed to upsert inventory operations: ${error.message}`);
        }
    }

    async upsertInventoryOperationDescriptions(descriptions: InventoryOperationDescriptionModel[]): Promise<void> {
        // Upsert inventory operation also synchronize inventory operation descriptions.
        return;
    }
}