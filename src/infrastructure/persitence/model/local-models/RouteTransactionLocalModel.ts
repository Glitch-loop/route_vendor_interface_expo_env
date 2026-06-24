import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";

export default interface RouteTransactionLocalModel extends ReplicationDataInterface {
  id_route_transaction: string,
  date: string,
  state: number,
  cash_received: number,
  latitude: string,
  longitude: string,
  id_work_day: string,
  id_payment_method: string,
  id_store: string,
}
