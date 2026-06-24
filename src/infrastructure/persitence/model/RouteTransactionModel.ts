import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";
import { ROUTE_TRANSACTION_STATE } from "@/src/core/enums/RouteTransactionState";
import PAYMENT_METHODS from "@/src/core/enums/PaymentMethod";
import RouteTransactionDescriptionModel from "./RouteTransactionDescriptionModel";

export default interface RouteTransactionModel extends ReplicationDataInterface {
  id_transaction: string,
  cfdi: string,
  received_amount: number,
  id_invoice_concept: string,
  created_at: string,
  latitude: string,
  longitude: string,
  id_location: string,
  id_client: string,
  id_work_day: string,
  id_payment_method: string,
  id_payment_schema: string,
  transaction_descriptions: RouteTransactionDescriptionModel[]
}
