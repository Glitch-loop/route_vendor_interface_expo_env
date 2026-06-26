import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";
import RouteTransactionDescriptionLocalModel from "@/src/infrastructure/persitence/model/local-models/RouteTransactionDescriptionLocalModel";

export default interface RouteTransactionLocalModel extends ReplicationDataInterface {
  id_route_transaction: string,
  date: string,
  state: string,
  cash_received: number,
  latitude: string,
  longitude: string,
  id_work_day: string,
  id_payment_method: string,
  id_store: string,
  transaction_descriptions: RouteTransactionDescriptionLocalModel[],
}
