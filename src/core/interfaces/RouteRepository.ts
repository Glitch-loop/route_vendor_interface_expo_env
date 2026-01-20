// Object values
import { Day } from '@/src/core/object-values/Day';
import { RouteDayStore } from '@/src/core/object-values/RouteDayStore';

// Entities
import { Route } from '@/src/core/entities/Route';
import { RouteDay } from '@/src/core/object-values/RouteDay';

export abstract class RouteRepository {
  abstract listRoutesByUser(user: string): Promise<Route[]>;
  abstract listRouteDaysByRoute(id_route: string): Promise<RouteDay[]>;
  abstract listRouteDayStoresByRoute(id_route_day: string): Promise<RouteDayStore[]>;
  abstract listDays(): Promise<Day[]>;
}