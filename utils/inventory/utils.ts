import { ICurrency } from "@/interfaces/interfaces";
import InventoryOperationDescriptionDTO from "@/src/application/dto/InventoryOperationDescriptionDTO";

export function getTotalAmountFromCashInventory(cashInventory:ICurrency[]):number {
  return cashInventory.reduce((acc, currentCurrency) =>
    { if (currentCurrency.amount === undefined || currentCurrency.amount === null) {return acc;} else {return acc + currentCurrency.amount * currentCurrency.value;}}, 0);
}

export function determineIfExistsOperationDescriptionMovement(operationMovements:InventoryOperationDescriptionDTO[]) {
  let isAtLeastOneMovement:boolean = false;

  operationMovements.forEach((inventory: InventoryOperationDescriptionDTO) => {
    const { amount } = inventory;
    if(amount > 0) isAtLeastOneMovement = true;
  });

  return isAtLeastOneMovement;
}