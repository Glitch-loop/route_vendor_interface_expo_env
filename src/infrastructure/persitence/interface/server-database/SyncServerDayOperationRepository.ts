import DayOperationModel from "@/src/infrastructure/persitence/model/DayOperationModel";

export abstract class SyncServerDayOperationRepository {
    abstract upsertDayOperations(operations: DayOperationModel[]): Promise<void>;
}
