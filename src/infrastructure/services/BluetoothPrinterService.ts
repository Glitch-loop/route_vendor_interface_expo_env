// Libraries
import { injectable, inject } from "tsyringe";
import RNBluetoothClassic, { BluetoothDevice, BluetoothDeviceEvent, BluetoothEventSubscription, BluetoothNativeDevice } from "react-native-bluetooth-classic";
import { PermissionsAndroid } from "react-native";

// Interfaces
import { PrinterService } from "@/src/core/interfaces/PrinterService";
import { PlatformPermissionsService } from "@/src/core/interfaces/PlatformPermissions";

// di container
import { TOKENS } from "@/src/infrastructure/di/tokens";


@injectable()
export class BluetoothPrinterService implements PrinterService {
    private deviceConnected: BluetoothDevice | null = null;
    private onDiscoverSubscription: BluetoothEventSubscription | null = null;
    private onDisconnectSubscription: BluetoothEventSubscription | null = null;
    private readonly deviceClassCode: number = 1664; // Example device class code for printers
    private readonly majorClassCode: number = 1536; // Example major class code for peripherals

    constructor(
        @inject(TOKENS.PlataformService) private readonly platformPermissionsService: PlatformPermissionsService
    ) {}
    private async arePrinterPermissionsGranted(): Promise<boolean> {
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

    private async requestPrinterPermissions(): Promise<boolean> {
        const permissionsToRequest = [
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];
        return await this.platformPermissionsService.requestPermissions(permissionsToRequest);
    }

    private async setBluetoothEnvironment(): Promise<void> {
        if (await this.arePrinterPermissionsGranted() === false) {
            const permissionsGranted = await this.requestPrinterPermissions();
            if (!permissionsGranted) throw new Error("Required Bluetooth permissions not granted.");
        }
        if (await this.isCommunicationMeanEnabled() === false) {
            if (!await RNBluetoothClassic.requestBluetoothEnabled()) throw new Error("Bluetooth is not enabled.");
        }
    }

    async connectToPrinter(): Promise<void> {
        if (await this.arePrinterPermissionsGranted() === false) {
            const permissionsGranted = await this.requestPrinterPermissions();
            if (!permissionsGranted) throw new Error("Required Bluetooth permissions not granted.");
        }
        if (await this.isCommunicationMeanEnabled() === false) {
            if (!await RNBluetoothClassic.requestBluetoothEnabled()) throw new Error("Bluetooth is not enabled.");
        }
        
        if (this.deviceConnected === null) {
            const bondedPrinters = await this.getBondedPrinters();
            
            if (bondedPrinters.length === 0) { // Discover devices
                RNBluetoothClassic.startDiscovery();
                this.onDiscoverSubscription = RNBluetoothClassic.onDeviceDiscovered((device: BluetoothDeviceEvent) => { this.discoverAndConnectToPrinter(device); });
                
            } else { // Printers already bonded
                for (const printer of bondedPrinters) {
                    await this.establishConnectionToPrinter(printer);
                }
            }
        } else {
            const { address } = this.deviceConnected
            if (await RNBluetoothClassic.isDeviceConnected(address)) return;
        }
    }

    async discoverAndConnectToPrinter(deviceCandidate: BluetoothDeviceEvent): Promise<void> {
        const anyDevice: any = deviceCandidate.device;
        const bonded = anyDevice?.bonded as boolean | undefined;
        const cls = anyDevice?.deviceClass;
        const dClass: number | undefined = cls && typeof cls === 'object' ? cls.deviceClass : undefined;
        const majorClass: number | undefined = cls && typeof cls === 'object' ? cls.majorClass : undefined;

        if (bonded !== undefined && dClass !== undefined && majorClass !== undefined) {
            if (dClass === this.deviceClassCode && majorClass === this.majorClassCode) {
                await this.establishConnectionToPrinter(anyDevice as BluetoothDevice);
            }
        }
    }

    async establishConnectionToPrinter(deviceToConnect: BluetoothDevice): Promise<void> {
        const { address } = deviceToConnect;
        const paired = await RNBluetoothClassic.pairDevice(address);
        const device = await RNBluetoothClassic.connectToDevice(address)
        // console.log("Paired: ", paired);
        // if (paired) {
        //     if (await RNBluetoothClassic.isDeviceConnected(address)) {
        //         this.deviceConnected = device;
        //         if (this.onDiscoverSubscription !== null) {
        //             this.onDiscoverSubscription.remove();
        //             this.onDiscoverSubscription = null;
        //         }
        //     }
        // };
    }

    async disconnectPrinter(): Promise<void> {
        if (this.deviceConnected !== null) {
            const { address } = this.deviceConnected;
            await RNBluetoothClassic.disconnectFromDevice(address);
            this.deviceConnected = null;
        }
    }

    private async isCommunicationMeanEnabled(): Promise<boolean> {
        return await RNBluetoothClassic.isBluetoothEnabled();
    }

    async statusListener(callback: (data: any) => void): Promise<void> {
        if (this.deviceConnected === null) throw new Error("No printer connected.");

        RNBluetoothClassic.onDeviceDisconnected((device: BluetoothDeviceEvent) => {
            const addressDevice = device.device.address;
            const { address } = this.deviceConnected!;
            
            if (addressDevice === address) {
                callback("disconnected");
                console.log("Printer disconnected");
            }
            
        });
    }


    // New methods
    async printTicket(messageToPrint: string): Promise<void> {
        // Implementation for printing ticket via Bluetooth
        if (this.deviceConnected === null) throw new Error("No printer connected.");

        const { address } = this.deviceConnected;
        const isConnected = await RNBluetoothClassic.isDeviceConnected(address);
        if (!isConnected) throw new Error("Printer is not connected.");

        await RNBluetoothClassic.writeToDevice(address, messageToPrint);
    }

    async connectDevice(device: BluetoothDevice): Promise<boolean> {
        await this.setBluetoothEnvironment();
        const { address, bonded } = device;
        
        if (!bonded) throw new Error("Device is not paired.");

        await RNBluetoothClassic.connectToDevice(address);
        const isConnected = await RNBluetoothClassic.isDeviceConnected(address);
        return isConnected;
    }

    async pairDevice(device: BluetoothDevice | BluetoothNativeDevice): Promise<boolean> {
        await this.setBluetoothEnvironment();
        const { address } = device;
        const devicePaired = await RNBluetoothClassic.pairDevice(address);
        const { bonded } = devicePaired;
        return bonded === undefined ? false : bonded.valueOf();
    }

    async unpairDevice(device: BluetoothDevice | BluetoothNativeDevice): Promise<boolean> {
        const { address } = device;
        await this.setBluetoothEnvironment();
        const result = await RNBluetoothClassic.unpairDevice(address);
        await RNBluetoothClassic.cancelDiscovery();
        await RNBluetoothClassic.startDiscovery();

        return result;
    }

    async disconnectDevice(device: BluetoothDevice): Promise<boolean> {
        await this.setBluetoothEnvironment();
        const { address } = device;
        await RNBluetoothClassic.disconnectFromDevice(address);
        return !(await RNBluetoothClassic.isDeviceConnected(address));
    }

    async disconnectPrinterListener(cb: (device: BluetoothDeviceEvent) => void): Promise<void> {
        // Listen for any device disconnect; UI can filter by address if needed
        if (this.onDisconnectSubscription === null) {
            this.onDisconnectSubscription = RNBluetoothClassic.onDeviceDisconnected((deviceEvent: BluetoothDeviceEvent) => {
                cb(deviceEvent);
            });
        }
    }

    async stopDisconnectPrinterListener(): Promise<void> {
        if (this.onDisconnectSubscription !== null) {
            this.onDisconnectSubscription.remove();
            this.onDisconnectSubscription = null;
        }
    }
    
    async getBondedPrinters(): Promise<BluetoothDevice[]> {
        await this.setBluetoothEnvironment();
        const bondedDevices:BluetoothDevice[] = await RNBluetoothClassic.getBondedDevices();
        const bondedPrinters: BluetoothDevice[] = bondedDevices.filter((device: BluetoothDevice) => { return this.determineIfDeviceIsPrinter(device); });
        return bondedPrinters;
    }

    async discoverPrinters(cb: (device: BluetoothDeviceEvent) => void) {
        if (this.onDiscoverSubscription === null) {
            await RNBluetoothClassic.cancelDiscovery();
            await RNBluetoothClassic.startDiscovery();
            this.onDiscoverSubscription = RNBluetoothClassic.onDeviceDiscovered(async (deviceEvent: BluetoothDeviceEvent) => { 
                const anyDevice: any = deviceEvent.device;
                const bonded = anyDevice?.bonded as boolean | undefined;
                


                if (bonded !== undefined) {
                    if (!bonded && this.determineIfDeviceIsPrinter(deviceEvent.device)) {
                        cb(deviceEvent); 
                    }
                }

            });
        }
    }

    async stopDiscoverPrinters(): Promise<void> {
        await this.setBluetoothEnvironment();
        if (this.onDiscoverSubscription !== null) {
            await RNBluetoothClassic.cancelDiscovery();
            this.onDiscoverSubscription.remove();
            this.onDiscoverSubscription = null;
        }
    }
    
    async getConnectedPrinter(): Promise<BluetoothDevice | null> {
        const connectedDevices: BluetoothDevice[] = await RNBluetoothClassic.getConnectedDevices();
        let connectedPrinter: BluetoothDevice | null = null;
        for (const connectedDevice of connectedDevices) {
            if (this.determineIfDeviceIsPrinter(connectedDevice)) {
                connectedPrinter = connectedDevice;
                break;
            }
        }

        this.deviceConnected = connectedPrinter;        
        return connectedPrinter;
    }

    private determineIfDeviceIsPrinter(device: BluetoothDevice | BluetoothNativeDevice): boolean {
        const cls: any = (device as any)?.deviceClass;
        const dClass: number | undefined = cls && typeof cls === 'object' ? cls.deviceClass : undefined;
        const majorClass: number | undefined = cls && typeof cls === 'object' ? cls.majorClass : undefined;
        return dClass === this.deviceClassCode || majorClass === this.majorClassCode;
    }
}