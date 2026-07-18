// Libraries
import React, { useEffect, useState } from 'react';
import { TextInput, Keyboard } from 'react-native';
import { delay } from 'tsyringe';
import tw from 'twrnc';

type AutomatedCorrectionNumberInputProps = {
  amount: number,
  onChangeAmount: (amount: number) => void,
  onSubmitEditing?: () => void,
  returnKeyType?: 'done' | 'next' | 'go' | 'search' | 'send',
  blurOnSubmit?: boolean,
  inputRef?: (ref: TextInput | null) => void,
};

const AutomatedCorrectionNumberInput = ({
  amount,
  onChangeAmount,
  onSubmitEditing,
  returnKeyType = 'done',
  blurOnSubmit = true,
  inputRef,
}: AutomatedCorrectionNumberInputProps) => {
  useEffect(() => {
    setInputValue(amount.toString());
  }, [amount])

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
    else {
      if (inputValue !== amount.toString()) { 
        handleTextChange(amount.toString());
      } else {
        handleTextChange(inputValue);

      }
    } 
  }

  const handleFocusInput = () => {
    setInputValue('');
  }

  return (
    <TextInput
      ref={inputRef}
      style={tw`mx-1 text-lg border border-solid bg-white rounded-md h-12 text-center`}
      value={inputValue}
      onFocus={ () => { handleFocusInput(); }}
      // onTouchStart={ () => { handleFocusInput(); } }
      onEndEditing={() => { handleOnLeaveInput(); }}
      onSubmitEditing={onSubmitEditing}
      onChangeText={(text) => { 
        setInputValue(text); 
        handleTextChange(text);
      }}
      returnKeyType={returnKeyType}
      blurOnSubmit={blurOnSubmit}
      keyboardType={'numeric'}/>
  );
};

export default AutomatedCorrectionNumberInput;
