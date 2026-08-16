// Libraries
import { inject, injectable } from "tsyringe";

// Interfaces
import { IDService } from "@/src/core/interfaces/IDService";
import { IUnitOfWork } from "@/src/core/interfaces/IUnitOfWork";
import { DateService } from "@/src/core/interfaces/DateService";
import { DayOperationRepository } from "@/src/core/interfaces/DayOperationRepository";
import { ProductInventoryRepository } from "@/src/core/interfaces/ProductInventoryRepository";
import { InventoryOperationRepository } from "@/src/core/interfaces/InventoryOperationRepository";

// Entities
import { DayOperation } from "@/src/core/entities/DayOperation";
import { InventoryOperation } from "@/src/core/entities/InventoryOperation";
import { WorkDayInformation } from "@/src/core/entities/WorkDayInformation";

// Aggregates
import { OperationDayAggregate } from "@/src/core/aggregates/OperationDayAggregate";
import { InventoryOperationAggregate } from "@/src/core/aggregates/InventoryOperationAggregate";

// Object value
import { InventoryOperationDescription } from "@/src/core/object-values/InventoryOperationDescription";

// DTOs and mapper
import { MapperDTO } from "@/src/application/mappers/MapperDTO";
import WorkDayInformationDTO from "@/src/application/dto/WorkdayInformationDTO";
import InventoryOperationDescriptionDTO from "@/src/application/dto/InventoryOperationDescriptionDTO";

// Utils
import { TOKENS } from "@/src/infrastructure/di/tokens";
import { DAY_OPERATIONS } from "@/src/core/enums/DayOperations";

@injectable()
export default class RegisterProductDevolutionUseCase {
  constructor(
    // Repositories
    @inject(TOKENS.SQLiteUnitOfWork) private readonly unitOfWork: IUnitOfWork,
    // @inject(TOKENS.SQLiteDayOperationRepository) private readonly localDayOperationRepo: DayOperationRepository,
    // @inject(TOKENS.SQLiteInventoryOperationRepository) private readonly localInventoryOperationRepo: InventoryOperationRepository,

    // Services
    @inject(TOKENS.IDService) private readonly idService: IDService,
    @inject(TOKENS.DateService) private readonly dateService: DateService,
  ) {}

  // TODO: Add synchronization with central database when online.
  private async executeUseCase(
    inventoryOperationDescriptions: InventoryOperationDescription[],
    workdayInformation: WorkDayInformation,
    id_user: string,
  ): Promise<void> {
    const { id_work_day, id_route_day } = workdayInformation;

    const dayOperations: DayOperation[] = await this.unitOfWork.execute(async (repo) => {
      return await repo.dayOperationRepository.listDayOperations();
    });
    
    const inventoryOperationAggregate: InventoryOperationAggregate =
      new InventoryOperationAggregate(null);
    const dayOperationAggregate: OperationDayAggregate =
      new OperationDayAggregate(dayOperations);

    // Create inventory operation
    inventoryOperationAggregate.createInventoryOperation(
      this.idService.generateID(),
      "0", // signConfirmation
      new Date(this.dateService.getCurrentTimestamp()),
      id_user,
      0, // audit
      DAY_OPERATIONS.product_devolution_inventory,
      id_work_day,
    );

    for (const description of inventoryOperationDescriptions) {
      const { price_at_moment, cost_at_moment, amount, id_product } =
        description;
      inventoryOperationAggregate.addInventoryOperationDescription(
        this.idService.generateID(),
        price_at_moment,
        cost_at_moment,
        amount,
        new Date(this.dateService.getCurrentTimestamp()),
        id_product,
      );
    }

    // This inventory doesn't have effect on the product inventory since it's a devolution.
    const newInventoryOperation: InventoryOperation =
      inventoryOperationAggregate.getInventoryOperation();
    const { id_inventory_operation } = newInventoryOperation;

    // Add day operation
    dayOperationAggregate.registerProductDevolutionInventory(
      this.idService.generateID(),
      id_inventory_operation,
      id_route_day,
      new Date(this.dateService.getCurrentTimestamp()),
    );

    // Persist all changes
    const newDayOperations: DayOperation[] = dayOperationAggregate.getNewDayOperations() || [];

    await this.unitOfWork.execute(async (repo) => {
      await repo.dayOperationRepository.insertDayOperations(newDayOperations);
      await repo.inventoryOperationRepository.createInventoryOperation(newInventoryOperation);
    });
  }

  async execute(
    inventoryOperationDescriptionDTO: InventoryOperationDescriptionDTO[],
    workdayInformationDTO: WorkDayInformationDTO,
    id_user: string,
  ): Promise<void> {
    const mapper = new MapperDTO();

    const inventoryOperationDescriptions: InventoryOperationDescription[] =
      inventoryOperationDescriptionDTO.map((descriptionDTO) =>
        mapper.toEntity(descriptionDTO),
      );
    const workdayInformation: WorkDayInformation = mapper.toEntity(
      workdayInformationDTO,
    );

    return await this.executeUseCase(
      inventoryOperationDescriptions,
      workdayInformation,
      id_user,
    );
  }
}
