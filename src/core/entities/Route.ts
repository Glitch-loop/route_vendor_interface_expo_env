import { RouteDay } from '@/src/core/object-values/RouteDay';

export class Route {
  constructor(
    public readonly id_route: string,
    public readonly route_name: string,
    public readonly description: string,
    public readonly route_status: boolean,
    public readonly id_vendor: string,
    public readonly route_day: RouteDay[]
  ) {}
}