// Entities
import { Store } from '@/src/core/entities/Store';
import { RouteTransaction } from '@/src/core/entities/RouteTransaction';

// Object values
import { RouteTransactionDescription } from '@/src/core/object-values/RouteTransactionDescription';

export abstract class RouteTransactionRepository {
  abstract insertRouteTransaction(route_transaction: RouteTransaction, is_synced: boolean): Promise<void>;
  abstract updateRouteTransaction(route_transaction: RouteTransaction): Promise<void>;
  abstract deleteRouteTransactions(route_transactions: RouteTransaction[]): Promise<void>;
  abstract listRouteTransactionByStore(id_store: string): Promise<RouteTransaction[]>;
  abstract listRouteTransactions(): Promise<RouteTransaction[]>;
  abstract retrieveRouteTransactionById(id_route_transactions: string[]): Promise<RouteTransaction[]>;
  abstract listRouteTransactionDescriptions(): Promise<RouteTransactionDescription[]>;
}