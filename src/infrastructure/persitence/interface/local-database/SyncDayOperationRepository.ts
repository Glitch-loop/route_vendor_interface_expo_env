import DayOperationModel from "@/src/infrastructure/persitence/model/DayOperationModel";

export abstract class SyncDayOperationInformationRepository {
    abstract listPendingDayOperationToSync(): Promise<DayOperationModel[]>;
    abstract markDayOperationAsSynced(ids: string[]): Promise<void>;
}