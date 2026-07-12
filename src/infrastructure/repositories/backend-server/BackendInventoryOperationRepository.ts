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
import DAY_OPERATIONS from '@/src/core/enums/DayOperations';

interface RequestInventoryOperations {
	id_inventory_operation: string[]
}

interface RequestCancelInventoryOperation {
	id_inventory_operation_to_reverse: string,
  reversed_by: string,
  created_at?: string,
  latitude?: string,
  longitude?: string,
}

interface ReverseInventoryOperationInterface {
	id_inventory_operation_to_reverse: string,
	reversed_by: string,
}

@injectable()
export class BackendInventoryOperationRepository implements SyncServerInventoryOperationRepository {
	constructor(@inject(TOKENS.BackendDataSource) private readonly dataSource: BackendDataSource) {}


	/*
		Note (07-11-26)
		For streamline the process of replication with the backend, it was created an 
		special endpoint for handling the replication of all the inventory operation types.

		Letting the reverse operation as the unique operation that has its unique endpoint. 
	*/

	async upsertInventoryOperations(operations: InventoryOperationServerModel[]): Promise<void> {
		if (!operations || operations.length === 0) return;

		try {
			for (const operation of operations) {
				const { id_inventory_operation_type, id_inventory_operation } = operation;

				console.log("Current inventory operation-----")
				console.log(operation)
				if (id_inventory_operation_type === DAY_OPERATIONS.cancel_inventory_operation) {
					await this.dataSource.post<unknown, ReverseInventoryOperationInterface>(
						'/inventories/operations/reverse',
						{
							id_inventory_operation_to_reverse: operation.id_inventory_operation,
							reversed_by: operation.id_user
						}
					);
				} else {
					await this.dataSource.post<unknown, InventoryOperationServerModel[]>(
						'/inventories/route',
						[ operation ]
					);
				}
			}
		} catch (error: any) {
				throw new Error(`Failed to upsert inventory operations: ${error.message}`);
		}
	}

	async upsertInventoryOperationDescriptions(descriptions: InventoryOperationDescriptionModel[]): Promise<void> {
		// Upsert inventory operation also synchronize inventory operation descriptions.
		return;
	}
}