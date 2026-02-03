import { injectable } from "tsyringe";
import { PlatformPermissionsService } from "@/src/core/interfaces/PlatformPermissions";
import { Permission, PermissionsAndroid, Platform } from "react-native";

@injectable()
export default class AndroidPlatformPermissions implements PlatformPermissionsService {
    async requestPermissions(permissions: Permission[]): Promise<boolean> {
        if (Platform.OS !== 'android') throw new Error('AndroidPlatformPermissions can only be used on Android platform.');

        const results = await PermissionsAndroid.requestMultiple(permissions);
        return Object.values(results).every(r => r === PermissionsAndroid.RESULTS.GRANTED);        
    }

    async isPermissionGranted(permission: Permission): Promise<boolean> {
        if (Platform.OS !== 'android') throw new Error('AndroidPlatformPermissions can only be used on Android platform.');
        return await PermissionsAndroid.check(permission);
    }

    async isPermissionDenied(permission: Permission): Promise<boolean> {
        if (Platform.OS !== 'android') throw new Error('AndroidPlatformPermissions can only be used on Android platform.');
        const isGranted = await PermissionsAndroid.check(permission);
        return !isGranted;
    }

    

}