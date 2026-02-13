// Libraries
import { inject, injectable } from "tsyringe";
import * as Location from 'expo-location'
import { PermissionsAndroid } from "react-native";

// Interfaces
import { LocationService } from "@/src/core/interfaces/LocationService";
import { PlatformPermissionsService } from "@/src/core/interfaces/PlatformPermissions";

// Object values
import { Coordinates } from "@/src/core/object-values/Coordinates";

// Utils
import { TOKENS } from "@/src/infrastructure/di/tokens";

@injectable()
export class GpsService implements LocationService {

    constructor(
        @inject(TOKENS.PlataformService) private readonly platformPermissionsService: PlatformPermissionsService
    ) { }

    async getCurrentLocation(): Promise<Coordinates | null> {
        await this.setGPSServiceEnvironment();

        if (!navigator.geolocation) {
            return null;
        }

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coordinates: Coordinates = new Coordinates(
                        position.coords.latitude,
                        position.coords.longitude
                    );
                    resolve(coordinates);
                },
                (error) => {
                    console.error('Error getting current location:', error);
                    resolve(null);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 10000
                }
            );
        });
    }

    private async areLocationPermissionsGranted(): Promise<boolean> {
        const permissionsNeeded = [
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        ];

        // Verify all permissions are granted
        for (const permission of permissionsNeeded) {
            const isGranted = await this.platformPermissionsService.isPermissionGranted(permission);
            if (!isGranted) {
                return false;
            }
        }

        return true;
    }

    private async requestLocationPermissions(): Promise<boolean> {
        const permissionsToRequest = [
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        ];
        
        return await this.platformPermissionsService.requestPermissions(permissionsToRequest);
    }

    private async isLocationServiceEnabled(): Promise<boolean> {
        return await Location.hasServicesEnabledAsync();
    }

    private async setGPSServiceEnvironment(): Promise<void> {
        if (await this.areLocationPermissionsGranted() === false) {
            const permissionsGranted = await this.requestLocationPermissions();
            if (!permissionsGranted) throw new Error("Required location permissions not granted.");
        }
        if (await this.isLocationServiceEnabled() === false) {
            throw new Error("Location services are not enabled. Please enable location services in your device settings.");
        }
    }
}