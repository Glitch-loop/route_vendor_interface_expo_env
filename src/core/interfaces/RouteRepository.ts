// Object values
import { Day } from '@/src/core/object-values/Day';
import { RouteDayStores } from '@/src/core/object-values/RouteDayStores';

// Entities
import { Route } from '@/src/core/entities/Route';

export abstract class RouteRepository {
  abstract listRoutesByUser(user: string): Promise<Route[]>;
  abstract listRoutesDayByRoute(id_route: string): Promise<RouteDayStores[]>;
  abstract listDays(): Promise<Day[]>;
}