import RouteDayStoreDTO  from "@/src/application/dto/RouteDayStoreDTO";

export default interface RouteDayDTO {
    id_route_day: string;
    id_route: string;
    id_day: string;
    stores: RouteDayStoreDTO[];
}