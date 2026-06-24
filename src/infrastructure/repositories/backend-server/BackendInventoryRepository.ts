// Libraries
import { injectable, inject } from 'tsyringe';

// Entities & object values
import { Inventory } from '@/src/core/entities/Inventory';
import { InventoryBalance } from '@/src/core/object-values/InventoryBalance';

// Interfaces
import { InventoryRepository } from '@/src/core/interfaces/InventoryRepository';

// Infrastructure
import { BackendDataSource } from '@/src/infrastructure/datasources/BackendDatasource';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';

interface InventoryBalanceResponseInterface {
  id_inventory_balance: string;
  quantity: number;
  min_quantity: number;
  max_quantity: number;
  created_at: string;
  id_inventory: string;
  id_product: string;
}

interface InventoryResponseInterface {
  id_inventory: string;
  inventory_context: number;
  inventory_name: string;
  is_active: number;
  stock_validation: number;
  updated_at: string;
  created_at: string;
  created_by: string;
  assigned_facility: string;
  assigned_to: string;
  inventory_balance: InventoryBalanceResponseInterface[];
}

@injectable()
export class BackendInventoryRepository implements InventoryRepository {
  constructor(@inject(TOKENS.BackendDataSource) private readonly dataSource: BackendDataSource) {}

  async listInventories(): Promise<Inventory[]> {
    try {
      const response = await this.dataSource.get<InventoryResponseInterface[]>(
        '/inventories'
      );

      return this.mapResponseToInventories(response);
    } catch (error: any) {
      throw new Error(`Failed to list inventories: ${error.message}`);
    }
  }

  private mapResponseToInventories(response: InventoryResponseInterface[]): Inventory[] {
    return response.map((inventoryData) => {
      const inventoryBalances = inventoryData.inventory_balance.map(
        (balanceData) =>
          new InventoryBalance(
            balanceData.id_inventory_balance,
            balanceData.quantity.toString(),
            balanceData.min_quantity,
            balanceData.max_quantity,
            balanceData.created_at,
            balanceData.id_inventory,
            balanceData.id_product
          )
      );

      return new Inventory(
        inventoryData.id_inventory,
        inventoryData.inventory_context,
        inventoryData.inventory_name,
        inventoryData.is_active,
        inventoryData.stock_validation,
        inventoryData.updated_at,
        inventoryData.created_at,
        inventoryData.created_by,
        inventoryData.assigned_facility,
        inventoryData.assigned_to,
        inventoryBalances
      );
    });
  }
}