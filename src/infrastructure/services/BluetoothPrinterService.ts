import { PrinterService } from "@/src/core/interfaces/PrinterService";
import { injectable, inject } from "tsyringe";
import { TOKENS } from "../di/tokens";
import { PlatformPermissionsService } from "@/src/core/interfaces/PlatformPermissions";
import { PermissionsAndroid } from "react-native";
import RNBluetoothClassic, { BluetoothDevice } from "react-native-bluetooth-classic";


@injectable()
export class BluetoothPrinterService implements PrinterService {
    constructor(
        @inject(TOKENS.PlataformService) private readonly platformPermissionsService: PlatformPermissionsService
    ) {}

    async printTicket(messageToPrint: string): Promise<void> {
        // Implementation for printing ticket via Bluetooth
        console.log("Printing ticket:", messageToPrint);
    }

    async arePrinterPermissionsGranted(): Promise<boolean> {
        let allPermissionsGranted = true;
        
        const permissionsNeeded = [
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, // Android 12+ (API 31+)
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, // Android 12+ (API 31+)
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, // Required for Bluetooth scanning on Android < 12
        ]

        // Verify permissions and if not granted, request them
        for (const permission of permissionsNeeded) {
            const isGranted = await this.platformPermissionsService.isPermissionGranted(permission);
            if (!isGranted) {
                allPermissionsGranted = false;
            }
        }

        return allPermissionsGranted;
    }

    async requestPrinterPermissions(): Promise<boolean> {
        const permissionsToRequest = [
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];
        return await this.platformPermissionsService.requestPermissions(permissionsToRequest);
    }

    async connectToPrinter(): Promise<void> {
        if (await this.arePrinterPermissionsGranted() === false) throw new Error("Bluetooth permissions are not granted.");
        if (await this.isCommunicationMeanEnabled() === false) throw new Error("Bluetooth is not enabled.");

        let statusConnection = false;
        let connectedDevices:BluetoothDevice[] = await RNBluetoothClassic.getConnectedDevices();
        
        
        for (let i = 0; i < connectedDevices.length; i++) {
            if (connectedDevices[i].deviceClass !== undefined) {
            const {deviceClass, majorClass} = connectedDevices[i].deviceClass;
            if(deviceClass === deviceClassCode && majorClassCode === majorClass) {
                statusConnection = true;
                connectedPritner = connectedDevices[i];
            }
            }
        }

        return statusConnection;


    }

    async disconnectPrinter(): Promise<void> {
        
    }

    async isPrinterConnected(): Promise<boolean> {
        return false;
    }

    async isCommunicationMeanEnabled(): Promise<boolean> {
        return await RNBluetoothClassic.isBluetoothEnabled();
    }
}