import WorkDayInformationModel from "@/src/infrastructure/persitence/model/WorkdayInformationModel";

export abstract class SyncWorkdayInformationRepository {
    abstract listPendingWorkdayInformationToSync(): Promise<WorkDayInformationModel[]>;
    abstract markWorkdayInformationAsSynced(ids: string[]): Promise<void>;
}