import { Route } from '../entities/Route';
import { Day } from '../object-values/Day';

export abstract class RouteRepository {
  abstract listRoutesByUser(user: string): Promise<Route[]>;
  abstract listDays(): Promise<Day[]>;
}