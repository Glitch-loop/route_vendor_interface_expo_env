// Libraries
import { injectable, inject } from 'tsyringe';

// Infrastructure
import { BackendDataSource } from '@/src/infrastructure/datasources/BackendDatasource';

// Interfaces
import { SyncServerRouteTransactionRepository } from '@/src/infrastructure/persitence/interface/server-database/SyncServerRouteTransactionRepository';

// Models
import RouteTransactionModel from '@/src/infrastructure/persitence/model/RouteTransactionModel';
import RouteTransactionDescriptionModel from '@/src/infrastructure/persitence/model/RouteTransactionDescriptionModel';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export class BackendRouteTransactionRepository implements SyncServerRouteTransactionRepository {
	constructor(@inject(TOKENS.BackendDataSource) private readonly dataSource: BackendDataSource) {}

	async upsertRouteTransactions(transactions: RouteTransactionModel[]): Promise<void> {
		if (!transactions || transactions.length === 0) return;

		try {
			for (const transaction of transactions) {
				await this.dataSource.post<unknown, RouteTransactionModel>(
					'/sellings/transactions',
					transaction
				);
			}
		} catch (error: any) {
			throw new Error(`Failed to upsert route transactions: ${error.message}`);
		}
	}

	async upsertRouteTransactionDescriptions(descriptions: RouteTransactionDescriptionModel[]): Promise<void> {
		if (!descriptions || descriptions.length === 0) return;

		try {
			for (const description of descriptions) {
				await this.dataSource.post<unknown, RouteTransactionDescriptionModel>(
					'/sellings/transactions',
					description
				);
			}
		} catch (error: any) {
			throw new Error(`Failed to upsert route transaction descriptions: ${error.message}`);
		}
	}
}
