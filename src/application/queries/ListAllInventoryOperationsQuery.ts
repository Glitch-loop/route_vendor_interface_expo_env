// Library
import { inject, injectable } from 'tsyringe';

// Interfaces
import { ProductInventoryRepository } from '@/src/core/interfaces/ProductInventoryRepository';

// Entities
import { ProductInventory } from '@/src/core/entities/ProductInventory';

// DTOs & Mapper
import ProductInventoryDTO from '@/src/application/dto/ProductInventoryDTO';
import { MapperDTO } from '@/src/application/mappers/MapperDTO';

// DI Tokens
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { InventoryOperationRepository } from '@/src/core/interfaces/InventoryOperationRepository';
import { InventoryOperation } from '@/src/core/entities/InventoryOperation';
import InventoryOperationDTO from '../dto/InventoryOperationDTO';

@injectable()
export default class ListAllInventoryOperationsQuery {
  constructor(
    @inject(TOKENS.SQLiteInventoryOperationRepository)
    private readonly inventoryOpRepo: InventoryOperationRepository,
    private readonly mapperDTO: MapperDTO,
  ) {}

  async execute(): Promise<InventoryOperationDTO[]> {
    const inventories: InventoryOperation[] = await this.inventoryOpRepo.listInventoryOperations();
    inventories.forEach((op) => console.log("num desc op: ", op.inventory_operation_descriptions.length, " - op id op type: ", op.id_inventory_operation_type));
    return inventories.map((pi) => this.mapperDTO.toDTO(pi));
  }
}

