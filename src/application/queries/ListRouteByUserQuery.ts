// Libraries
import { inject, injectable } from "tsyringe";

// Interfaces
import { RouteRepository } from "@/src/core/interfaces/RouteRepository";

// Entities
import { Route } from "@/src/core/entities/Route";

// Object values
import { RouteDayStore } from "@/src/core/object-values/RouteDayStore";

// Mapper DTO
import RouteDTO from "@/src/application/dto/RouteDTO";
import { MapperDTO } from "@/src/application/mappers/MapperDTO";

// Utils
import { TOKENS } from "@/src/infrastructure/di/tokens";
import { RouteDay } from "@/src/core/object-values/RouteDay";

@injectable()
export class ListRoutesByUserQuery {
    constructor(
        @inject(TOKENS.SupabaseRouteRepository) private repo: RouteRepository,
        @inject(MapperDTO) private mapper: MapperDTO
    ) { }

    async execute(userId: string): Promise<RouteDTO[]> {
        const vendorRoutes: Route[] = [];
        const routes: Route[] = await this.repo.listRoutesByUser(userId);
        
        // Get the routes of the vendor and group the clients to attend by route day.
        for (const route of routes) {
            const routeDayOfRoute:RouteDay[] = [];
            const routeDays:RouteDay[] = await this.repo.listRouteDaysByRoute(route.id_route);
            
            for (const routeDay of routeDays) {
                const routeDayStores: RouteDayStore[] = await this.repo.listRouteDayStoresByRoute(routeDay.id_route_day);
                routeDayOfRoute.push(new RouteDay(
                    routeDay.id_route_day,
                    routeDay.id_route,
                    routeDay.id_day,
                    routeDayStores
                ))
            }

            vendorRoutes.push(new Route(
                route.id_route,
                route.route_name,
                route.description,
                route.route_status,
                route.id_vendor,
                routeDayOfRoute
            ));
            
        }

        return vendorRoutes.map(route => this.mapper.toDTO(route));
    }
}