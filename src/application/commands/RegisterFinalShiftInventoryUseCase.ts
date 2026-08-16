// Libraries
import { inject, injectable } from "tsyringe";

// Interfaces
import { IDService } from "@/src/core/interfaces/IDService";
import { IUnitOfWork } from "@/src/core/interfaces/IUnitOfWork";
import { DateService } from "@/src/core/interfaces/DateService";
import { StoreRepository } from "@/src/core/interfaces/StoreRepository";
import { InventoryOperation } from "@/src/core/entities/InventoryOperation";
import { ProductRepository } from "@/src/core/interfaces/ProductRepository";
import { DayOperationRepository } from "@/src/core/interfaces/DayOperationRepository";
import { ProductInventoryRepository } from "@/src/core/interfaces/ProductInventoryRepository";
import { InventoryOperationRepository } from "@/src/core/interfaces/InventoryOperationRepository";
import { ShiftOrganizationRepository } from "@/src/core/interfaces/ShiftOrganizationRepository";

// Enums
import DAY_OPERATIONS from "@/src/core/enums/DayOperations";

// Object values
import { InventoryOperationDescription } from "@/src/core/object-values/InventoryOperationDescription";

// Entities
import { WorkDayInformation } from "@/src/core/entities/WorkDayInformation";
import { DayOperation } from "@/src/core/entities/DayOperation";

// Aggregates
import { OperationDayAggregate } from "@/src/core/aggregates/OperationDayAggregate";
import { ShiftOrganizationAggregate } from "@/src/core/aggregates/ShiftOrganizationAggregate";
import { InventoryOperationAggregate } from "@/src/core/aggregates/InventoryOperationAggregate";

// DTOs and mapper
import { MapperDTO } from "@/src/application/mappers/MapperDTO"; 
import InventoryOperationDescriptionDTO from "@/src/application/dto/InventoryOperationDescriptionDTO";
import WorkDayInformationDTO from "@/src/application/dto/WorkdayInformationDTO";

// DI container
import { TOKENS } from "@/src/infrastructure/di/tokens";

/**
 * StartWorkDayUseCase - Uses SQLite for local/offline operations
 * This use case demonstrates injecting a specific repository implementation
 */
@injectable()
export default class RegisterFinalShiftInventoryUseCase {
	constructor(
		// Local repositories dependencies
		// @inject(TOKENS.SQLiteShiftOrganizationRepository) private readonly localShiftDayRepo: ShiftOrganizationRepository,
		// @inject(TOKENS.SQLiteInventoryOperationRepository) private readonly localInventoryOperationRepo: InventoryOperationRepository,
		// @inject(TOKENS.SQLiteProductInventoryRepository) private readonly localProductInventoryRepo: ProductInventoryRepository,
		// @inject(TOKENS.SQLiteDayOperationRepository) private readonly localDayOperationRepo: DayOperationRepository,
		@inject(TOKENS.SQLiteUnitOfWork) private readonly unitOfWork: IUnitOfWork,

		// Remote repositories dependencies
		@inject(TOKENS.ServerStoreRepository) private readonly remoteStoreRepo: StoreRepository,
		
		// Services depdendencies
		@inject(TOKENS.IDService) private readonly idService: IDService,
		@inject(TOKENS.DateService) private readonly dateService: DateService,
	) { }
	// TODO: Add synchronization with central database when online.
	private async executeUseCase(
		petty_cash: number,
		inventoryOperationDescriptions: InventoryOperationDescription[],
		workdayInformation: WorkDayInformation,
		created_by: string
	): Promise<void> {
		const shiftORganizationAggregate: ShiftOrganizationAggregate = new ShiftOrganizationAggregate(workdayInformation);
		const inventoryOperationAggregate: InventoryOperationAggregate = new InventoryOperationAggregate(null);
		const dayOperationAggregate: OperationDayAggregate = new OperationDayAggregate(null);
		
		// Finish work day.
		shiftORganizationAggregate.finishWorkDay(
			petty_cash,
			new Date(this.dateService.getCurrentTimestamp()),
		)
		
		const finalWorkDayInformation: WorkDayInformation = shiftORganizationAggregate.getWorkDayInformation();

		// Create inventory operation for finishing work day.
		const { id_work_day, id_route_day } = finalWorkDayInformation;

		inventoryOperationAggregate.createInventoryOperation(
			this.idService.generateID(),
			'0', // signConfirmation
			new Date(this.dateService.getCurrentTimestamp()),
			created_by,
			0, // audit
			DAY_OPERATIONS.end_shift_inventory,
			id_work_day,
		);

		for (const description of inventoryOperationDescriptions) {
			const { price_at_moment, cost_at_moment, amount, id_product } = description;
			inventoryOperationAggregate.addInventoryOperationDescription(
				this.idService.generateID(),
				price_at_moment,
				cost_at_moment,
				amount,
				new Date(this.dateService.getCurrentTimestamp()),
				id_product
			)
		}

		const newInventoryOperation:InventoryOperation = inventoryOperationAggregate.getInventoryOperation();
		const { id_inventory_operation} = newInventoryOperation;

		// Register day operation
		dayOperationAggregate.registerEndShiftInventory(
			this.idService.generateID(),
			id_inventory_operation,
			id_route_day,
			new Date(this.dateService.getCurrentTimestamp()),
		)

		const dayOperations: DayOperation[] = dayOperationAggregate.getNewDayOperations() || [];

		// Store information in local database.
		await this.unitOfWork.execute(async (repo) => {
			await repo.dayOperationRepository.insertDayOperations(dayOperations!);
			await repo.shiftOrganizationRepository.updateWorkDay(finalWorkDayInformation);
			await repo.inventoryOperationRepository.createInventoryOperation(newInventoryOperation);        
    });
		
		// await this.localShiftDayRepo.updateWorkDay(finalWorkDayInformation);
		// await this.localInventoryOperationRepo.createInventoryOperation(newInventoryOperation);        
		// await this.localDayOperationRepo.insertDayOperations(dayOperations!);

}

async execute(
		petty_cash: number,
		inventoryOperationDescriptionDTO: InventoryOperationDescriptionDTO[],
		workdayInformationDTO: WorkDayInformationDTO,
		created_by: string
): Promise<void> {
		const mapper = new MapperDTO();

		const inventoryOperationDescriptions: InventoryOperationDescription[] = inventoryOperationDescriptionDTO
			.map((descriptionDTO) => mapper.toEntity(descriptionDTO));

		const workdayInformation: WorkDayInformation = mapper.toEntity(workdayInformationDTO);

		return await this.executeUseCase(
			petty_cash,
			inventoryOperationDescriptions,
			workdayInformation,
			created_by
		);
	}
}
