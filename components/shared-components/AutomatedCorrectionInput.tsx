// Libraries
import React, { useState } from 'react';
import { TextInput, Keyboard } from 'react-native';
import { delay } from 'tsyringe';
import tw from 'twrnc';

const AutomatedCorrectionNumberInput = ({
  amount,
  onChangeAmount,
}:{
  amount:number,
  onChangeAmount:any
}) => {
  const [inputValue, setInputValue] = useState(amount.toString());
  
  // Handlers
  const handleTextChange = (input:string) => {
    let resultInput:number = 0;
    let parsedInput:number = parseInt(input, 10);

    if (isNaN(parsedInput)) {
      resultInput = 0;
    } else {
      /* Number range for this component >= 0 */
      if (parsedInput < 0) {
        resultInput = 0;
      } else {
        resultInput = parsedInput;
      }
    }
    setInputValue(input);

    setTimeout(() => { onChangeAmount(resultInput); }, 100);
  };

  const handleOnLeaveInput = () => {
    if(inputValue === '') handleTextChange(amount.toString());
    else handleTextChange(inputValue);
  }

  const handleFocusInput = () => {
    if (inputValue === '0') {
      setInputValue('');
    }
  }

  return (
    <TextInput
      style={tw`mx-1 text-lg border border-solid bg-white rounded-md h-12 text-center`}
      value={inputValue}
      onTouchStart={ () => { handleFocusInput(); } }
      onEndEditing={() => { handleOnLeaveInput(); }}
      onChangeText={(text) => { 
        setInputValue(text); 
        handleTextChange(text);
      }}
      keyboardType={'numeric'}/>
  );
};

export default AutomatedCorrectionNumberInput;
