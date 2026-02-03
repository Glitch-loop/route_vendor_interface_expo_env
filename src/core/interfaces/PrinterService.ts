export abstract class PrinterService {
    abstract printTicket(messageToPrint: string): Promise<void>;
    abstract connectToPrinter(): Promise<void>;
    abstract disconnectPrinter(): Promise<void>;
    abstract isPrinterConnected(): Promise<boolean>;
    abstract arePrinterPermissionsGranted(): Promise<boolean>;
    abstract requestPrinterPermissions(): Promise<boolean>;
    abstract isCommunicationMeanEnabled(): Promise<boolean>;
} 