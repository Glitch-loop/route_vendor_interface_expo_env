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
export default class GetInventoryOperationByIDQuery {
	constructor(
		@inject(TOKENS.SQLiteInventoryOperationRepository)
		private readonly inventoryOpRepo: InventoryOperationRepository,
		private readonly mapperDTO: MapperDTO,
	) {}

	async execute(id_inventory_operation: string): Promise<InventoryOperationDTO | null> {
		const operations = await this.inventoryOpRepo.retrieveInventoryOperations([id_inventory_operation]);
		if (!operations || operations.length === 0) return null;

		// Retrieve descriptions for the operation(s)
		const descriptions = await this.inventoryOpRepo.retrieveInventoryOperationDescription(operations);
		const descByOpId = descriptions.reduce<Record<string, InventoryOperationDescription[]>>((acc, desc) => {
			const key = desc.id_inventory_operation;
			(acc[key] ||= []).push(
				new InventoryOperationDescription(
					desc.id_inventory_operation_description,
					desc.price_at_moment,
					desc.amount,
					desc.created_at instanceof Date ? desc.created_at : new Date(desc.created_at),
					desc.id_inventory_operation,
					desc.id_product
				)
			);
			return acc;
		}, {});

		// Build a fully populated domain entity for the requested ID
		const raw = operations[0] as any;
		const entity = new InventoryOperation(
			raw.id_inventory_operation,
			raw.sign_confirmation,
			raw.date instanceof Date ? raw.date : new Date(raw.date),
			raw.state,
			raw.audit,
			raw.id_inventory_operation_type,
			raw.id_work_day,
			descByOpId[raw.id_inventory_operation] || []
		);

		return this.mapperDTO.toDTO(entity);
	}
}

