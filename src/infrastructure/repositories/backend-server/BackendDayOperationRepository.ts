
// Libraries
import { injectable, inject } from 'tsyringe';

// Infrastructure
import { BackendDataSource } from '@/src/infrastructure/datasources/BackendDatasource';

// Interfaces
import { SyncServerDayOperationRepository } from '@/src/infrastructure/persitence/interface/server-database/SyncServerDayOperationRepository';

// Models
import DayOperationModel from '@/src/infrastructure/persitence/model/server-models/DayOperationServerModel';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';

interface UpsertDayOperationRequestInterface {
	id_day_operation: string;
	id_operation_type?: string;
	created_at: string;
	latitude?: string;
	longitude?: string;
	id_location?: string;
	id_route_transaction?: string;
	id_inventory_operation?: string;
	id_route_day?: string;
	id_day_operation_dependent?: string;
	id_work_day_operation?: string;
}

@injectable()
export class BackendDayOperationRepository implements SyncServerDayOperationRepository {
	constructor(@inject(TOKENS.BackendDataSource) private readonly dataSource: BackendDataSource) {}

	async upsertDayOperations(operations: DayOperationModel[]): Promise<void> {
		if (!operations || operations.length === 0) return;

		try {
			for (const operation of operations) {
				const request = this.toUpsertDayOperationRequest(operation);
				await this.dataSource.post<unknown, UpsertDayOperationRequestInterface>(
					'/business-operation-route/work-days/operations',
					request
				);
			}
		} catch (error: any) {
			throw new Error(`Failed to upsert day operations: ${error.message}`);
		}
	}

	private toUpsertDayOperationRequest(operation: DayOperationModel): UpsertDayOperationRequestInterface {
		const operationAsAny = operation as any;

		return {
			id_day_operation: operation.id_day_operation,
			id_operation_type: operationAsAny.id_operation_type ?? operationAsAny.operation_type,
			created_at: this.normalizeDate(operation.created_at),
			latitude: operationAsAny.latitude,
			longitude: operationAsAny.longitude,
			id_location: operationAsAny.id_location ?? operationAsAny.id_item,
			id_route_transaction: operationAsAny.id_route_transaction,
			id_inventory_operation: operationAsAny.id_inventory_operation,
			id_route_day: operationAsAny.id_route_day,
			id_day_operation_dependent: operationAsAny.id_day_operation_dependent ?? operationAsAny.id_dependency,
			id_work_day_operation: operationAsAny.id_work_day_operation,
		};
	}

	private normalizeDate(value: Date | string): string {
		if (typeof value === 'string') return value;
		return value.toISOString();
	}
}