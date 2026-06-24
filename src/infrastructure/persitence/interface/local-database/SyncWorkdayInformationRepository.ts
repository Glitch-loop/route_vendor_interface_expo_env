import WorkDayInformationLocalModel from "@/src/infrastructure/persitence/model/local-models/WorkdayInformationLocalModel";

export abstract class SyncWorkdayInformationRepository {
    abstract listPendingWorkdayInformationToSync(): Promise<WorkDayInformationLocalModel[]>;
    abstract markWorkdayInformationAsSynced(ids: string[]): Promise<void>;
}