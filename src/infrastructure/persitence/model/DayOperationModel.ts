import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";

export default interface DayOperationModel extends ReplicationDataInterface {
  id_day_operation: string,
  id_item: string,
  operation_type: string,
  created_at: Date,
  id_dependency: string,
  latitude: string,
  longitude: string
}
