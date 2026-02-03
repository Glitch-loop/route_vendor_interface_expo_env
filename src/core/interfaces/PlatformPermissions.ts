import { Permission } from "react-native";

export abstract class PlatformPermissionsService {
    abstract requestPermissions(permissions: Permission[]): Promise<boolean>;
    abstract isPermissionGranted(permission: Permission): Promise<boolean>;
    abstract isPermissionDenied(permission: Permission): Promise<boolean>;
}