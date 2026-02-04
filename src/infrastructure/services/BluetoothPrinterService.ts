import { PrinterService } from "@/src/core/interfaces/PrinterService";
import { injectable, inject } from "tsyringe";
import { TOKENS } from "../di/tokens";
import { PlatformPermissionsService } from "@/src/core/interfaces/PlatformPermissions";
import { PermissionsAndroid } from "react-native";
import RNBluetoothClassic, { BluetoothDevice, BluetoothDeviceEvent, BluetoothEventSubscription, BluetoothNativeDevice } from "react-native-bluetooth-classic";


@injectable()
export class BluetoothPrinterService implements PrinterService {
    private deviceConnected: BluetoothDevice | null = null;
    private onDiscoverSubscription: BluetoothEventSubscription | null = null;
    private readonly deviceClassCode: number = 1664; // Example device class code for printers
    private readonly majorClassCode: number = 1536; // Example major class code for peripherals

    constructor(
        @inject(TOKENS.PlataformService) private readonly platformPermissionsService: PlatformPermissionsService
    ) {}

    async printTicket(messageToPrint: string): Promise<void> {
        // Implementation for printing ticket via Bluetooth
        console.log("Printing ticket:", messageToPrint);

    }

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
                console.log("Discovering devices...");
                RNBluetoothClassic.startDiscovery();
                this.onDiscoverSubscription = RNBluetoothClassic.onDeviceDiscovered((device: BluetoothDeviceEvent) => { this.discoverAndConnectToPrinter(device); });
                
            } else { // Printers already bonded
                console.log("Connecting to bonded printers...");
                for (const printer of bondedPrinters) {
                    const { address } = printer;
                    console.log("Candidate printer to connect: ", address);
                    await this.establishConnectionToPrinter(printer);
                }
            }
        } else {
            const { address } = this.deviceConnected
            if (await RNBluetoothClassic.isDeviceConnected(address)) return;
        }
    }

    async discoverAndConnectToPrinter(deviceCandidate: BluetoothDeviceEvent): Promise<void> {
        console.log("Discovered device: ", deviceCandidate);
        const { device } = deviceCandidate;
        const { deviceClass, address, bonded } = device
        if (deviceClass !== undefined && bonded !== undefined) {
            const dClass:number = deviceClass.deviceClass;
            const majorClass:number = deviceClass.majorClass;

            if (dClass === this.deviceClassCode && majorClass === this.majorClassCode) {
                await this.establishConnectionToPrinter(device);
            }
        }
    }

    async establishConnectionToPrinter(deviceToConnect: BluetoothDevice): Promise<void> {
        console.log("Establishing connection")
        const { address } = deviceToConnect;
        console.log("Device to connect: ", address);
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
        RNBluetoothClassic.cancelDiscovery();
        RNBluetoothClassic.startDiscovery();

        return result;
    }

    async disconnectDevice(device: BluetoothDevice): Promise<boolean> {
        await this.setBluetoothEnvironment();
        const { address } = device;
        await RNBluetoothClassic.disconnectFromDevice(address);
        return !(await RNBluetoothClassic.isDeviceConnected(address));
    }

    async getBondedPrinters(): Promise<BluetoothDevice[]> {
        await this.setBluetoothEnvironment();
        const bondedDevices:BluetoothDevice[] = await RNBluetoothClassic.getBondedDevices();

        const bondedPrinters: BluetoothDevice[] = bondedDevices.filter((device: BluetoothDevice) => {
            const {deviceClass, majorClass} = device.deviceClass;
            return deviceClass === this.deviceClassCode && majorClass === this.majorClassCode;
        });

        return bondedPrinters;
    }

    async discoverDevice(cb: (device: BluetoothDeviceEvent) => void) {
        console.log("Setting up Bluetooth environment for discovery...");
        if (this.onDiscoverSubscription === null) {
            console.log("Starting discovery for devices...");
            RNBluetoothClassic.startDiscovery();
            this.onDiscoverSubscription = RNBluetoothClassic.onDeviceDiscovered((deviceEvent: BluetoothDeviceEvent) => { 
                const { device } = deviceEvent;
                const { bonded } = device;
                const {deviceClass, majorClass} = device.deviceClass;

                if (bonded !== undefined) {
                    if (!bonded && (deviceClass === this.deviceClassCode || majorClass === this.majorClassCode)) {
                        console.log("Discovered printer device: ", bonded);
                        cb(deviceEvent); 
                    }
                }

            });
        }
    }

    async stopDiscoverDevice(): Promise<void> {
        await this.setBluetoothEnvironment();
        if (this.onDiscoverSubscription !== null) {
            this.onDiscoverSubscription.remove();
            this.onDiscoverSubscription = null;
        }
    }
    
}