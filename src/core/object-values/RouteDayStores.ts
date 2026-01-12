export class RouteDayStores {
  constructor(
    public readonly id_route_day_store: string,
    public readonly position_in_route: number,
    public readonly id_route_day: string,
    public readonly id_store: string,
    public readonly method: string
  ) {}
}