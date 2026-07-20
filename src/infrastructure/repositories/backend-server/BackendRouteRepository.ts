// Libraries
import { injectable, inject } from 'tsyringe';

// Object values
import { Day } from '@/src/core/object-values/Day';
import { RouteDay } from '@/src/core/object-values/RouteDay';
import { RouteDayStore } from '@/src/core/object-values/RouteDayStore';

// Entities
import { Route } from '@/src/core/entities/Route';

// Interfaces
import { RouteRepository } from '@/src/core/interfaces/RouteRepository';

// Infrastructure
import { BackendDataSource } from '@/src/infrastructure/datasources/BackendDatasource';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { DAYS } from '@/src/core/constants/days';

interface RouteDayLocationInterface {
  position_in_route: number;
  id_location: string;
  id_route_day: string;
  id_route_day_location: string;
}

interface RouteDayInterface {
  id_route_day: string;
  id_route: string;
  id_day: string;
  locations: RouteDayLocationInterface[];
}

interface RouteInterface {
  id_route: string;
  route_name: string;
  description: string;
}

interface RouteDayByUserRequest {
  id_users: string[];
}

interface RouteDaysByRouteRequest {
  id_routes: string[];
}
interface RouteDaysByRouteDayRequest {
  id_route_days: string[];
}

@injectable()
export class BackendRouteRepository implements RouteRepository {
  constructor(@inject(TOKENS.BackendDataSource) private readonly dataSource: BackendDataSource) {}


  async listRoutesByUser(user: string): Promise<Route[]> {
    try {
      const routeDayByUserRequest: RouteDayByUserRequest = { id_users: []} 
      const routesId: Set<string> = new Set<string>()
      const routes: Map<string, Route> = new Map<string, Route>()
      const routesArr: Route[] = [];

      // Retrieve assigned route days.
      routeDayByUserRequest.id_users.push(user);
      const responseRouteDays: RouteDayInterface[] = await this.dataSource.post<RouteDayInterface[], RouteDayByUserRequest>(
        '/route-organization/routes/days/users/ids',
        routeDayByUserRequest
      );

      // Retrieve routes of the route days that are assiend to the user.
      responseRouteDays.forEach((assignedRoute) => {
        const { id_route } = assignedRoute;
        routesId.add(id_route)
      });


      /*
        Note (06-25-26)
        Endpoint doesn't provide a way to retrieve all the routes.
        There is not an "next_item" field for knowing if there is more information
        for retrieving.
      */
      const responseRoutes = await this.dataSource.get<RouteInterface[]>(
        '/route-organization/routes'
      );
      
      // Organizing the information
      responseRoutes.data.forEach((route: RouteInterface) => {
        const { id_route, route_name, description } = route;
        if (routesId.has(id_route)) {
          const newRoute: Route = new Route(
            id_route,
            route_name,
            description,
            true, // Only active routes can be retrieved.
            user, // This request is only for the id user that is in the param.
            []
          )

          routes.set(id_route, newRoute) 
        }
      });

      responseRouteDays.forEach((assignedRoute) => {
        const {id_route} = assignedRoute;
        if (routes.has(id_route)) {
          routes.get(id_route)?.route_day.push(this.convertFromRouteDayInterfaceToRouteDayEntity(assignedRoute));
        }
      });

      for(const id_route of routesId) {
        routesArr.push(routes.get(id_route)!);
      }

      return routesArr        
    } catch (error) {
      throw new Error('Error fetching routes: ' + error);
    }
  }

  async listDays(): Promise<Day[]> {
    const days: Day[] = [];
    for (const id_day in DAYS) {
      days.push(
        new Day(
          DAYS[id_day].id_day,
          DAYS[id_day].day_name,
          DAYS[id_day].order_to_show,
        )
      );
    }

    return days;
  }

  async listRouteDaysByRoute(id_route: string): Promise<RouteDay[]> {
    try {
      const routeDayByRouteRequest: RouteDaysByRouteRequest = { id_routes: [id_route] }
      const routeDaysEntities: RouteDay[] = [];
      const responseRouteDays: RouteDayInterface[] = await this.dataSource.post<RouteDayInterface[], RouteDaysByRouteRequest>(
        '/route-organization/routes/days/routes/ids',
        routeDayByRouteRequest
      );

      responseRouteDays.forEach((assignedRoute) => {
        routeDaysEntities.push(this.convertFromRouteDayInterfaceToRouteDayEntity(assignedRoute));
      });

      return routeDaysEntities;
    } catch (error) {
      throw new Error('Error fetching route days by route' + error);
    }
  }

  async listRouteDayStoresByRoute(id_route_day: string): Promise<RouteDayStore[]> {
    try {
      const routeDayByRouteDayID: RouteDaysByRouteDayRequest = { id_route_days: [id_route_day] };
      const routeDayStores: RouteDayStore[] = [];
      const responseRouteDays: RouteDayInterface[] = await this.dataSource.post<RouteDayInterface[], RouteDaysByRouteDayRequest>(
        '/route-organization/routes/days/ids',
        routeDayByRouteDayID
      );

      if(responseRouteDays.at(0)) {
        const { locations } = responseRouteDays.at(0)!
        for(const location of locations) {
          routeDayStores.push(this.convertRouteDayStoreInterfaceToRouteDayStoreObjectValue(location))
        }
      }
      return routeDayStores;
    } catch (error) {
      throw new Error('Error fetching route day stores by route day' + error);
    }
  }

  private convertFromRouteDayInterfaceToRouteDayEntity(routeDay: RouteDayInterface): RouteDay {
    const { id_route, id_day, id_route_day, locations } = routeDay;
    const routeDayStores: RouteDayStore[] = [];
    locations.forEach((location) => {
      routeDayStores.push(this.convertRouteDayStoreInterfaceToRouteDayStoreObjectValue(location));
    });

    return new RouteDay(
      id_route_day,
      id_route,
      id_day,
      routeDayStores
    );
  }

  private convertRouteDayStoreInterfaceToRouteDayStoreObjectValue(routeDayLocation: RouteDayLocationInterface): RouteDayStore {
    const {  
        position_in_route,
        id_location,
        id_route_day,
        id_route_day_location, 
    } = routeDayLocation;

    return new RouteDayStore(
        id_route_day_location,
        position_in_route,
        id_route_day,
        id_location
      )

  }
}