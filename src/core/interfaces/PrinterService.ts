export abstract class PrinterService {
    abstract printTicket(messageToPrint: string): Promise<void>;
    abstract connectToPrinter(): Promise<void>;
    abstract disconnectPrinter(): Promise<void>;
} 