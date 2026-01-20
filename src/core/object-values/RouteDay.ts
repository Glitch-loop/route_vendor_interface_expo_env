import { RouteDayStore } from "@/src/core/object-values/RouteDayStore";

export class RouteDay {
    constructor(
        public readonly id_route_day: string,
        public readonly id_route: string,
        public readonly id_day: string,
        public readonly stores: RouteDayStore[]
    ) {}
}