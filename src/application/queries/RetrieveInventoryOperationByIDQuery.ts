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
		if (!operations || operations.length === 0) return [];

		// Retrieve descriptions for the operation(s)
		const descriptions = await this.inventoryOpRepo.retrieveInventoryOperationDescription(operations);
		const descByOpId = descriptions.reduce<Record<string, InventoryOperationDescription[]>>((acc, desc) => {
			const key = (desc as any).id_inventory_operation;
			(acc[key] ||= []).push(
				new InventoryOperationDescription(
					(desc as any).id_inventory_operation_description,
					(desc as any).price_at_moment,
					(desc as any).amount,
					(desc as any).created_at instanceof Date ? (desc as any).created_at : new Date((desc as any).created_at),
					(desc as any).id_inventory_operation,
					(desc as any).id_product
				)
			);
			return acc;
		}, {});

		// Build fully populated domain entities per operation and map to DTOs
		const dtos: InventoryOperationDTO[] = [];
		for (const op of operations as any[]) {
			const entity = new InventoryOperation(
				op.id_inventory_operation,
				op.sign_confirmation,
				op.date instanceof Date ? op.date : new Date(op.date),
				op.state,
				op.audit,
				op.id_inventory_operation_type,
				op.id_work_day,
				descByOpId[op.id_inventory_operation] || []
			);
			dtos.push(this.mapperDTO.toDTO(entity));
		}

		return dtos;
	}
}

