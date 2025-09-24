import { RouteTransaction } from '../entities/RouteTransaction';
import { Store } from '../entities/Store';

export abstract class IRouteTransaction {
  abstract insertRouteTransaction(route_transaction: RouteTransaction): void;
  abstract updateRouteTransaction(route_transaction: RouteTransaction): void;
  abstract listRouteTransactions(): RouteTransaction[];
  abstract listRouteTransactionByStore(store: Store): RouteTransaction[];
  abstract retrieveRouteTransactionByStore(id_route_transaction: string[]): RouteTransaction[];
  abstract deleteRouteTransactions(route_transactions: RouteTransaction[]): void;
}