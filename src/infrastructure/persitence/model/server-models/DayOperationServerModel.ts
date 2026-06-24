import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";

export default interface DayOperationServerModel extends ReplicationDataInterface {
  id_operation_type: string,
  created_at: Date,
  latitude: string,
  longitude: string,
  id_location: string,
  id_route_transaction: string,
  id_inventory_operation: string,
  id_route_day: string,
  id_day_operation: string,
  id_day_operation_dependent: string,
  id_work_day_operation: string,
}
