import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";

export default interface DayOperationLocalModel extends ReplicationDataInterface {
  id_day_operation: string,
  id_item: string,
  id_route_day: string,
  operation_type: string,
  created_at: string,
  id_dependency?: string,
  latitude?: string,
  longitude?: string
}