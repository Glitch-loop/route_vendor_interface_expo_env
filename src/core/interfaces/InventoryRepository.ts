import { Inventory } from "@/src/core/entities/Inventory";

export abstract class InventoryRepository {
    abstract listInventories(): Promise<Inventory[]>;
}