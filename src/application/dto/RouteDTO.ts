import RouteDayDTO  from "@/src/application/dto/RouteDayDTO";

export default interface RouteDTO {
    id_route: string;
    route_name: string;
    description: string;
    route_status: boolean;
    id_vendor: string;
    route_day_by_day: Map<string, RouteDayDTO>; // <id_day, RouteDayDTO>
}