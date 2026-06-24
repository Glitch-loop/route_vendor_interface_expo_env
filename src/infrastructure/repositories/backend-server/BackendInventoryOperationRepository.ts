// Libraries
import { injectable, inject } from 'tsyringe';

// Infrastructure
import { BackendDataSource } from '@/src/infrastructure/datasources/BackendDatasource';

// Interfaces
import { SyncServerInventoryOperationRepository } from '@/src/infrastructure/persitence/interface/server-database/SyncServerInventoryOperationRepository';

// Models
import InventoryOperationModel from '@/src/infrastructure/persitence/model/server-models/InventoryOperationServerModel';
import InventoryOperationDescriptionModel from '@/src/infrastructure/persitence/model/server-models/InventoryOperationDescriptionServerModel';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export class BackendInventoryOperationRepository implements SyncServerInventoryOperationRepository {
    constructor(@inject(TOKENS.BackendDataSource) private readonly dataSource: BackendDataSource) {}

    async upsertInventoryOperations(operations: InventoryOperationModel[]): Promise<void> {
        if (!operations || operations.length === 0) return;

        try {
            for (const operation of operations) {
                await this.dataSource.post<unknown, InventoryOperationModel>(
                    '/inventories/operations/internal',
                    operation
                );
            }
        } catch (error: any) {
            throw new Error(`Failed to upsert inventory operations: ${error.message}`);
        }
    }

    async upsertInventoryOperationDescriptions(descriptions: InventoryOperationDescriptionModel[]): Promise<void> {
        if (!descriptions || descriptions.length === 0) return;

        try {
            for (const description of descriptions) {
                await this.dataSource.post<unknown, InventoryOperationDescriptionModel>(
                    '/inventories/operations/internal',
                    description
                );
            }
        } catch (error: any) {
            throw new Error(`Failed to upsert inventory operation descriptions: ${error.message}`);
        }
    }
}