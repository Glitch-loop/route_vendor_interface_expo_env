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