// Libraries
import { injectable, inject } from 'tsyringe';

// Infrastructure
import { BackendDataSource } from '@/src/infrastructure/datasources/BackendDatasource';

// Interfaces
import { SyncServerRouteTransactionRepository } from '@/src/infrastructure/persitence/interface/server-database/SyncServerRouteTransactionRepository';

// Models
import RouteTransactionServerModel from '@/src/infrastructure/persitence/model/server-models/RouteTransactionServerModel';
import RouteTransactionDescriptionServerModel from '@/src/infrastructure/persitence/model/server-models/RouteTransactionDescriptionServerModel';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export class BackendRouteTransactionRepository implements SyncServerRouteTransactionRepository {
	constructor(@inject(TOKENS.BackendDataSource) private readonly dataSource: BackendDataSource) {}

	async upsertRouteTransactions(transactions: RouteTransactionServerModel[]): Promise<void> {
		if (!transactions || transactions.length === 0) return;

		try {
			for (const transaction of transactions) {
				await this.dataSource.post<unknown, RouteTransactionServerModel>(
					'/sellings/transactions',
					transaction
				);
			}
		} catch (error: any) {
			throw new Error(`Failed to upsert route transactions: ${error.message}`);
		}
	}

	async upsertRouteTransactionDescriptions(descriptions: RouteTransactionDescriptionServerModel[]): Promise<void> {
		if (!descriptions || descriptions.length === 0) return;

		try {
			for (const description of descriptions) {
				await this.dataSource.post<unknown, RouteTransactionDescriptionServerModel>(
					'/sellings/transactions',
					description
				);
			}
		} catch (error: any) {
			throw new Error(`Failed to upsert route transaction descriptions: ${error.message}`);
		}
	}
}
