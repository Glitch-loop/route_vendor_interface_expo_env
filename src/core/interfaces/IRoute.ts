import { Route } from '../entities/Route';
import { Day } from '../object_values/Day';

export abstract class IRoute {
  abstract listRoutes(user: string): Route[];
  abstract listDays(): Day[];
}