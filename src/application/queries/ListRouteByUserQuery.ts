// Libraries
import { inject, injectable } from "tsyringe";

// Interfaces
import { RouteRepository } from "@/src/core/interfaces/RouteRepository";

// Entities
import { Route } from "@/src/core/entities/Route";

// Object values
import { RouteDayStores } from "@/src/core/object-values/RouteDayStores";

// Utils
import { TOKENS } from "@/src/infrastructure/di/tokens";

@injectable()
export class ListRouteByUserQuery {
    constructor(@inject(TOKENS.RouteRepository) private repo: RouteRepository) { }

    async execute(userId: string): Promise<Route[]> {
        const vendorRoutes: Route[] = [];
        const routes: Route[] = await this.repo.listRoutesByUser(userId);
        
        // Get the routes of the vendor and group the clients to attend by route day.
        for (const route of routes) {
            const routeDays = await this.repo.listRoutesDayByRoute(route.id_route);
            const routeDayMap = new Map<string, RouteDayStores[]>();

            for (const routeDay of routeDays) {
                const { id_route_day } = routeDay;
                routeDayMap.get(id_route_day)
                    ? routeDayMap.get(id_route_day)?.push(routeDay)
                    : routeDayMap.set(id_route_day, [routeDay]);
            }

            vendorRoutes.push(new Route(
                route.id_route,
                route.route_name,
                route.description,
                route.route_status,
                route.id_vendor,
                routeDayMap
            ));
            
        }

        return vendorRoutes;
    }
}