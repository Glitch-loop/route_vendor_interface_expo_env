
// Libraries
import { injectable, inject } from 'tsyringe';

// Infrastructure
import { BackendDataSource } from '@/src/infrastructure/datasources/BackendDatasource';

// Interfaces
import { SyncServerDayOperationRepository } from '@/src/infrastructure/persitence/interface/server-database/SyncServerDayOperationRepository';

// Models
import DayOperationServerModel from '@/src/infrastructure/persitence/model/server-models/DayOperationServerModel';

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

interface UpsertDayOperations {
  id_work_day: string, 
  operations: DayOperationServerModel[],
}

@injectable()
export class BackendDayOperationRepository implements SyncServerDayOperationRepository {
	constructor(@inject(TOKENS.BackendDataSource) private readonly dataSource: BackendDataSource) {}

	async upsertDayOperations(idWorkDay: string, operations: DayOperationServerModel[]): Promise<void> {
		if (!operations || operations.length === 0) return;

		try {
      await this.dataSource.post<unknown, UpsertDayOperations>(
        '/business-operation-route/work-days/operations',
        {
          id_work_day: idWorkDay, 
          operations: operations
        }
      );
		} catch (error: any) {
			throw new Error(`Failed to upsert day operations: ${error.message}`);
		}
	}

	private normalizeDate(value: Date | string): string {
		if (typeof value === 'string') return value;
		return value.toISOString();
	}
}