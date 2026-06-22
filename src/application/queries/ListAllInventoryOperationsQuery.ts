// Library
import { inject, injectable } from 'tsyringe';

// Repositories
import { InventoryOperationRepository } from '@/src/core/interfaces/InventoryOperationRepository';

// Entities
import { InventoryOperation } from '@/src/core/entities/InventoryOperation';

// DTOs & Mapper
import { MapperDTO } from '@/src/application/mappers/MapperDTO';
import InventoryOperationDTO from '@/src/application/dto/InventoryOperationDTO';

// DI Tokens
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export default class ListAllInventoryOperationsQuery {
  constructor(
    @inject(TOKENS.SQLiteInventoryOperationRepository)
    private readonly inventoryOpRepo: InventoryOperationRepository,
    private readonly mapperDTO: MapperDTO,
  ) {}

  async execute(): Promise<InventoryOperationDTO[]> {
    const inventories: InventoryOperation[] = await this.inventoryOpRepo.listInventoryOperations();
    return inventories.map((pi) => this.mapperDTO.toDTO(pi));
  }
}

