export function capitalizeFirstLetter(input: string|undefined|null): string {
  if (!input || input === undefined || input === null) {
    return '';
  } else {
    return input.charAt(0).toUpperCase() + input.slice(1);
  }
}

export function capitalizeFirstLetterOfEachWord(input: string|undefined|null): string {
  if(!input || input === undefined || input === null) {
    return '';
  } else {
    let arrWords:string[] = input.split(' ');
    let sentence:string = '';

    arrWords.forEach((word:string) => {
      sentence = sentence + word.charAt(0).toUpperCase() + word.slice(1) + ' ';
    });

    sentence = sentence.trimEnd()
    
    return sentence;
  }
}

export function cleanStringToStoreInDatabase(input: string): string {
  return input.trim().toLowerCase();
}

export function formatNumberAsAccountingCurrency(amount: number, currencySymbol: string = '$'): string {
  if (Number.isNaN(amount)) {
    return `${currencySymbol}0.00`;
  }

  const absoluteValue = Math.abs(amount);
  const formattedNumber = absoluteValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return amount < 0
    ? `-${currencySymbol}${formattedNumber}`
    : `${currencySymbol}${formattedNumber}`;
}

