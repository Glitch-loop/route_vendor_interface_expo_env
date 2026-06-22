// Libraries
import { inject, injectable } from "tsyringe";

// Interfaces
import { RouteRepository } from "@/src/core/interfaces/RouteRepository";

// Entities
import { Route } from "@/src/core/entities/Route";

// Object values
import { RouteDay } from "@/src/core/object-values/RouteDay";
import { RouteDayStore } from "@/src/core/object-values/RouteDayStore";

// Mapper DTO
import RouteDTO from "@/src/application/dto/RouteDTO";
import { MapperDTO } from "@/src/application/mappers/MapperDTO";

// Utils
import { TOKENS } from "@/src/infrastructure/di/tokens";

@injectable()
export default class ListRoutesByUserQuery {
    constructor(
        @inject(TOKENS.ServerRouteRepository) private repo: RouteRepository,
        @inject(MapperDTO) private mapper: MapperDTO
    ) { }

    async execute(userId: string): Promise<RouteDTO[]> {
        const vendorRoutes: Route[] = [];
        const routes: Route[] = await this.repo.listRoutesByUser(userId);

        console.log("Number of stores", routes.at(0)?.route_day.at(0)?.stores.length)

        /*
            Note (06/18/26): About the routes assigned to users.

            Before a full route was assigned to a user this made sense 
            because in the day-to-day a user attends the same route days
            all the weeks. 
            
            The concern was what happens when the manager wants to assign an specific
            route day to another user that is not the official user assigned?

            It's because this use case that instead of understanding the assignations 
            by route now, it is understanding that a route day can be assigned to 
            an user, so if a manager wants to assign a full route he needs to assign 
            all the route days that compound the route.
         */
        
        // Get the routes of the vendor and group the clients to attend by route day.
        // for (const route of routes) {
        //     const routeDayOfRoute:RouteDay[] = [];
        //     const routeDays:RouteDay[] = await this.repo.listRouteDaysByRoute(route.id_route);
            
        //     for (const routeDay of routeDays) {
        //         const routeDayStores: RouteDayStore[] = await this.repo.listRouteDayStoresByRoute(routeDay.id_route_day);
        //         routeDayOfRoute.push(new RouteDay(
        //             routeDay.id_route_day,
        //             routeDay.id_route,
        //             routeDay.id_day,
        //             routeDayStores
        //         ))
        //     }

        //     vendorRoutes.push(new Route(
        //         route.id_route,
        //         route.route_name,
        //         route.description,
        //         route.route_status,
        //         route.id_vendor,
        //         routeDayOfRoute
        //     ));
            
        // }

        return routes.map(route => this.mapper.toDTO(route));
    }
}