import DayOperationModel from "@/src/infrastructure/persitence/model/server-models/DayOperationServerModel";

export abstract class SyncServerDayOperationRepository {
    abstract upsertDayOperations(idWorkDay: string, operations: DayOperationModel[]): Promise<void>;
}
