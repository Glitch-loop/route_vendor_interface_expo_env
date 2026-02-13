import { Coordinates } from "@/src/core/object-values/Coordinates";

export abstract class LocationService {
    abstract getCurrentLocation(): Promise<Coordinates | null>;
}