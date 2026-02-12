// Libraries
import React, { useState } from 'react';
import { ToastAndroid } from 'react-native';

// Utils
import PAYMENT_METHODS from '@/src/core/enums/PaymentMethod';

// UI Components
import PaymentMenu from '@/components/sale-layout/PaymentMenu';
import PaymentMethod from '@/components/sale-layout/PaymentMethod';
import ActionDialog from '@/components/shared-components/ActionDialog';

const PaymentProcess = ({
  transactionIdentifier,
  totalToPay,
  paymentProcess,
  onCancelPaymentProcess,
  onPaySale,
}:{
  transactionIdentifier:string,
  totalToPay:number,
  paymentProcess:boolean,
  onCancelPaymentProcess:any,
  onPaySale:any,
}) => {

  const [confirmedPaymentMethod, setConfirmedPaymentMethod] = useState<boolean>(false);

  const [paymnetMethod, setPaymentMethod] = useState<PAYMENT_METHODS>(PAYMENT_METHODS.CASH); // Cash as default payment method
  const [cashReceived, setCashReceived] = useState<number>(0);

  const handleConfirmPaymentMethod = () => {
    setConfirmedPaymentMethod(true);
  };


  const handlerPaySale = async () => {
    let resultCashMovement = 0;
    let messageToShow = '';

    if (paymnetMethod === PAYMENT_METHODS.CASH) {
      // Cash payment method
      if (totalToPay >= 0) {
          /* It means the vendor will receive money, product of a sale or due to a product devolution with positive balance */
        resultCashMovement = cashReceived - totalToPay;
        messageToShow = 'El dinero a recibir tiene que ser igual o mayor al total.';
      } else {
        /* It means the vendor will give money, product of a product devolution with negative balance */
        resultCashMovement = totalToPay + cashReceived;
        messageToShow = 'El dinero a entregar tiene que cubrir el monto a reponer.';
      }

      if (resultCashMovement >= 0) {
        // Call to the function to register the sale
        await onPaySale(cashReceived, paymnetMethod);
      } else {
        ToastAndroid.show(messageToShow, 1500);
      }
    } else if (paymnetMethod === PAYMENT_METHODS.TRANSFER){
      // Transference method
      /* Since transference is a digital method, the vendor doesn't recieve cash, so
      according with the flow of the application, cashReceived should be zero. */
      await onPaySale(cashReceived, paymnetMethod);
    }
  };

  const handlerDeclineDialog = () => {
    setCashReceived(0);
    onCancelPaymentProcess(false);
    setPaymentMethod(PAYMENT_METHODS.CASH); // Resetting to default payment method.
    setConfirmedPaymentMethod(false);
  };

  return (
    <ActionDialog
    visible={paymentProcess}
    onAcceptDialog={confirmedPaymentMethod === true ? handlerPaySale : handleConfirmPaymentMethod}
    onDeclinedialog={handlerDeclineDialog}>
      { confirmedPaymentMethod === true ?
        <PaymentMenu
          transactionIdentifier={transactionIdentifier}
          total={totalToPay}
          paymentMethod={paymnetMethod}
          onCashReceived={setCashReceived}/>
          :
        <PaymentMethod
          currentPaymentMethod={paymnetMethod}
          onSelectPaymentMethod={setPaymentMethod}
          />
      }
    </ActionDialog>
  );
};

export default PaymentProcess;
