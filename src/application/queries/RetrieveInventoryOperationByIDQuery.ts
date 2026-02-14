// Library
import { inject, injectable } from 'tsyringe';

// Interfaces
import { InventoryOperationRepository } from '@/src/core/interfaces/InventoryOperationRepository';

// Entities
import { InventoryOperation } from '@/src/core/entities/InventoryOperation';
import { InventoryOperationDescription } from '@/src/core/object-values/InventoryOperationDescription';

// DTOs & Mapper
import InventoryOperationDTO from '@/src/application/dto/InventoryOperationDTO';
import { MapperDTO } from '@/src/application/mappers/MapperDTO';

// DI Tokens
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export default class RetrieveInventoryOperationByIDQuery {
	constructor(
		@inject(TOKENS.SQLiteInventoryOperationRepository)
		private readonly inventoryOpRepo: InventoryOperationRepository,
		private readonly mapperDTO: MapperDTO,
	) {}

	async execute(id_inventory_operation: string[]): Promise<InventoryOperationDTO[]> {
		const operations = await this.inventoryOpRepo.retrieveInventoryOperations(id_inventory_operation);
		return operations.map((op: InventoryOperation) => this.mapperDTO.toDTO(op));
	}
}

