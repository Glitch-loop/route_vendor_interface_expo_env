import WorkDayInformationModel from "@/src/infrastructure/persitence/model/WorkdayInformationModel";

export abstract class SyncServerWorkdayInformationRepository {
    abstract upsertWorkdayInformations(informations: WorkDayInformationModel[]): Promise<void>;
}