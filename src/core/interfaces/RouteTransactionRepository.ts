// Entities
import { RouteTransaction } from '../entities/RouteTransaction';
import { Store } from '../entities/Store';

// Object values
import { PaymentMethod } from '../object-values/PaymentMethod';
import { RouteTransactionDescription } from '../object-values/RouteTransactionDescription';

export abstract class RouteTransactionRepository {
  abstract insertRouteTransaction(route_transaction: RouteTransaction): Promise<void>;
  abstract updateRouteTransaction(route_transaction: RouteTransaction): Promise<void>;
  abstract deleteRouteTransactions(route_transactions: RouteTransaction[]): Promise<void>;
  abstract listRouteTransactionByStore(store: Store): Promise<RouteTransaction[]>;
  abstract listRouteTransactions(): Promise<RouteTransaction[]>;
  abstract retrieveRouteTransactionById(id_route_transactions: string[]): Promise<RouteTransaction[]>;
  abstract listRouteTransactionDescriptions(): Promise<RouteTransactionDescription[]>;
}