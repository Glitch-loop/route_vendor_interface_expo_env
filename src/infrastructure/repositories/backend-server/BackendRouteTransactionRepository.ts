// Libraries
import { injectable, inject } from 'tsyringe';

// Interfaces
import { SyncServerRouteTransactionRepository } from '@/src/infrastructure/persitence/interface/server-database/SyncServerRouteTransactionRepository';

// Entities
import { Store } from '@/src/core/entities/Store';
import { RouteTransaction } from '@/src/core/entities/RouteTransaction';

// Object values
import { RouteTransactionDescription } from '@/src/core/object-values/RouteTransactionDescription';

// Infrastructure
import { BackendDataSource } from '@/src/infrastructure/datasources/BackendDatasource';

// Models
import RouteTransactionServerModel from '@/src/infrastructure/persitence/model/server-models/RouteTransactionServerModel';
import RouteTransactionDescriptionServerModel from '@/src/infrastructure/persitence/model/server-models/RouteTransactionDescriptionServerModel';


// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { RouteTransactionRepository } from '@/src/core/interfaces/RouteTransactionRepository';
import DAY_OPERATIONS from '@/src/core/enums/DayOperations';
import { ROUTE_TRANSACTION_STATE } from '@/src/core/enums/RouteTransactionState';
import PAYMENT_METHODS from '@/src/core/enums/PaymentMethod';


interface RouteTransactionWithRouteDescriptions extends RouteTransactionServerModel {
	transaction_descriptions: RouteTransactionDescriptionServerModel[]
}

@injectable()
export class BackendRouteTransactionRepository implements RouteTransactionRepository, SyncServerRouteTransactionRepository {
	constructor(@inject(TOKENS.BackendDataSource) private readonly dataSource: BackendDataSource) {}
	
	async insertRouteTransaction(route_transaction: RouteTransaction): Promise<void> { 
		/*
			Note (06-25-26)
			Vendor's app must not implement this method.
		*/
		return; 
	};
	
	async updateRouteTransaction(route_transaction: RouteTransaction): Promise<void> {
		/*
			Note (06-25-26)
			Vendor's app must not implement this method.
		*/
		return; 
	};
	
	async deleteRouteTransactions(route_transactions: RouteTransaction[]): Promise<void> {
		/*
			Note (06-25-26)
			Vendor's app must not implement this method.
		*/
		return; 
	};
	
	async listRouteTransactionByStore(id_store: string): Promise<RouteTransaction[]> { 
		/*
			Note (06-25-26)

			The intention of this implementation is to retrieve historical data to avoid 
			heavy requests, this call is limited to the 'last' 4 active transactions.
		*/
		try {

			const routeTransaction: RouteTransaction[] = [];
			const response = await this.dataSource.get<RouteTransactionWithRouteDescriptions[]>(
				`/sellings/transactions?limit=4&transaction_status=1&id_location=${id_store}`
			);

			const routeTransactionServerModel: RouteTransactionWithRouteDescriptions[] = response.data

			for(const transaction of routeTransactionServerModel) {
				const { transaction_descriptions } = transaction;
				routeTransaction.push(
					new RouteTransaction(
						transaction.id_transaction,
						new Date(transaction.created_at),
						ROUTE_TRANSACTION_STATE.ACTIVE, // Note (06-25-26): By default the requet only retrieve active operations.
						transaction.received_amount,
						transaction.id_work_day,
						transaction.id_location,
						transaction.latitude,
						transaction.longitude,
						transaction.id_payment_method as PAYMENT_METHODS, 
						transaction_descriptions.map((descriptions) => {
							return new RouteTransactionDescription(
								descriptions.id_route_transaction_description,
								descriptions.price_at_moment,
								descriptions.cost_at_moment,
								descriptions.quantity,
								new Date(descriptions.created_at),
								'', // Note (06-25-26): Since this route transaction doesn't belong to this day, it doesn't have a product inventory.
								descriptions.id_transaction_operation_type as DAY_OPERATIONS,
								descriptions.id_product,
								descriptions.id_route_transaction_description
							)
						}),
					)
				);
			}

			return routeTransaction;
		} catch(error) {
			console.error('Something went wrong during route transaction retrieving by store: ' + error)
			return [];
		}
	};

	async listRouteTransactions(): Promise<RouteTransaction[]> { 
		/*
			Note (06-25-26)
			Vendor's app must not implement this method.
		*/
		return []; 
	};

	async retrieveRouteTransactionById(id_route_transactions: string[]): Promise<RouteTransaction[]> { 
		/*
			Note (06-25-26)
			Vendor's app must not implement this method.
		*/
		return []; 
	};

	async listRouteTransactionDescriptions(): Promise<RouteTransactionDescription[]> { 
		/*
			Note (06-25-26)
			Vendor's app must not implement this method.
		*/
		return []; 
	};


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
