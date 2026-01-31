// Libraries
import { inject, injectable } from "tsyringe";

// Interfaces
import { StoreRepository } from "@/src/core/interfaces/StoreRepository";
import { InventoryOperation } from "@/src/core/entities/InventoryOperation";
import { ShiftOrganizationRepository } from "@/src/core/interfaces/ShiftOrganizationRepository";
import { InventoryOperationRepository } from "@/src/core/interfaces/InventoryOperationRepository";
import { ProductInventoryRepository } from "@/src/core/interfaces/ProductInventoryRepository";
import { DayOperationRepository } from "@/src/core/interfaces/DayOperationRepository";
import { ProductRepository } from "@/src/core/interfaces/ProductRepository";
import { IDService } from "@/src/core/interfaces/IDService";
import { DateService } from "@/src/core/interfaces/DateService";

// Object values
import { InventoryOperationDescription } from "@/src/core/object-values/InventoryOperationDescription";

// Entities
import { WorkDayInformation } from "@/src/core/entities/WorkDayInformation";

// Aggregates
import { ShiftOrganizationAggregate } from "@/src/core/aggregates/ShiftOrganizationAggregate";
import { InventoryOperationAggregate } from "@/src/core/aggregates/InventoryOperationAggregate";
import { OperationDayAggregate } from "@/src/core/aggregates/OperationDayAggregate";

// DTOs and mapper
import InventoryOperationDescriptionDTO from "@/src/application/dto/InventoryOperationDescriptionDTO";
import { MapperDTO } from "@/src/application/mappers/MapperDTO"; 

// Utils
import { TOKENS } from "@/src/infrastructure/di/tokens";
import DAY_OPERATIONS from "@/src/core/enums/DayOperations";
import WorkDayInformationDTO from "../dto/WorkdayInformationDTO";
import { DayOperation } from "@/src/core/entities/DayOperation";

/**
 * StartWorkDayUseCase - Uses SQLite for local/offline operations
 * This use case demonstrates injecting a specific repository implementation
 */
@injectable()
export default class RegisterFinalShiftInventoryUseCase {
    constructor(
        // Local repositories dependencies
        @inject(TOKENS.SQLiteShiftOrganizationRepository) private readonly localShiftDayRepo: ShiftOrganizationRepository,
        @inject(TOKENS.SQLiteInventoryOperationRepository) private readonly localInventoryOperationRepo: InventoryOperationRepository,
        @inject(TOKENS.SQLiteProductInventoryRepository) private readonly localProductInventoryRepo: ProductInventoryRepository,
        @inject(TOKENS.SQLiteDayOperationRepository) private readonly localDayOperationRepo: DayOperationRepository,
        
        // Remote repositories dependencies
        @inject(TOKENS.SupabaseStoreRepository) private readonly remoteStoreRepo: StoreRepository,
        
        // Services depdendencies
        @inject(TOKENS.IDService) private readonly idService: IDService,
        @inject(TOKENS.DateService) private readonly dateService: DateService,
    ) { }
    // TODO: Add synchronization with central database when online.
    private async executeUseCase(
        petty_cash: number,
        inventoryOperationDescriptions: InventoryOperationDescription[],
        workdayInformation: WorkDayInformation): Promise<void> {

        const shiftORganizationAggregate: ShiftOrganizationAggregate = new ShiftOrganizationAggregate(workdayInformation);
        const inventoryOperationAggregate: InventoryOperationAggregate = new InventoryOperationAggregate(null);
        const dayOperationAggregate: OperationDayAggregate = new OperationDayAggregate(null, null);
        
        // Finish work day.
        shiftORganizationAggregate.finishWorkDay(
            petty_cash,
            new Date(this.dateService.getCurrentTimestamp()),
        )
        
        const finalWorkDayInformation: WorkDayInformation = shiftORganizationAggregate.getWorkDayInformation();

        // Create inventory operation for finishing work day.
        const { id_work_day } = finalWorkDayInformation;

        inventoryOperationAggregate.createInventoryOperation(
            this.idService.generateID(),
            '0', // signConfirmation
            new Date(this.dateService.getCurrentTimestamp()),
            0, // audit
            DAY_OPERATIONS.end_shift_inventory,
            id_work_day
        );

        for (const description of inventoryOperationDescriptions) {
            const { price_at_moment, amount, id_product } = description;
            inventoryOperationAggregate.addInventoryOperationDescription(
                this.idService.generateID(),
                price_at_moment,
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
            new Date(this.dateService.getCurrentTimestamp()),
        )

        const dayOperations: DayOperation[] = dayOperationAggregate.getNewDayOperations() || [];
    
        // Store information in local database.
        await this.localShiftDayRepo.updateWorkDay(finalWorkDayInformation);
        await this.localInventoryOperationRepo.createInventoryOperation(newInventoryOperation);        
        await this.localDayOperationRepo.insertDayOperations(dayOperations!);

    }

    async execute(
        petty_cash: number,
        inventoryOperationDescriptionDTO: InventoryOperationDescriptionDTO[],
        workdayInformationDTO: WorkDayInformationDTO,
    ): Promise<void> {
        const mapper = new MapperDTO();

        const inventoryOperationDescriptions: InventoryOperationDescription[] = inventoryOperationDescriptionDTO
            .map((descriptionDTO) => mapper.toEntity(descriptionDTO))
        const workdayInformation: WorkDayInformation = mapper.toEntity(workdayInformationDTO);

        return await this.executeUseCase(
            petty_cash,
            inventoryOperationDescriptions,
            workdayInformation
        );
    }
}
