import DayOperationLocalModel from "@/src/infrastructure/persitence/model/local-models/DayOperationLocalModel";
import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";

export abstract class SyncDayOperationInformationRepository {
    abstract listPendingDayOperationToSync(): Promise<(DayOperationLocalModel&ReplicationDataInterface)[]>;
    abstract markDayOperationAsSynced(ids: string[]): Promise<void>;
}