import WorkDayInformationModel from "@/src/infrastructure/persitence/model/WorkdayInformationModel";
import UserModel from "@/src/infrastructure/persitence/model/UserModel";

export abstract class SyncServerWorkdayInformationRepository {
    abstract upsertWorkdayInformations(informations: (WorkDayInformationModel&UserModel)[]): Promise<void>;
}