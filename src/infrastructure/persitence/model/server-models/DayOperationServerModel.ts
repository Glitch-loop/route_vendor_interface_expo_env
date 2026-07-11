import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";

export default interface DayOperationServerModel extends ReplicationDataInterface {
  id_operation_type: string,
  created_at: string,
  latitude: string | null,
  longitude: string | null,
  id_location: string | null,
  id_route_transaction: string | null,
  id_inventory_operation: string | null,
  id_route_day: string,
  id_day_operation_dependent: string | null,
  id_work_day_operation: string,
}
