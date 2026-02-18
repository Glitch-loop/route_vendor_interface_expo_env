export const headerTitleTableStyle:string = 'h-12 flex flex-row justify-center items-center';
export const viewTagHeaderTableStyle:string = 'h-12 flex flex-row justify-center items-center';
export const textHeaderTableStyle:string = 'text-center text-black text-base';

export const rowTableStyle:string = '';
export const cellTableStyle:string = 'h-12 flex flex-row justify-center items-center';
export const cellTableStyleWithAmountOfProduct:string = 'h-12 flex flex-row justify-center items-center bg-amber-100';
export const viewTagRowTableStyle:string = 'h-12 flex flex-row items-center justify-center';
export const textRowTableStyle:string = 'text-center text-black flex flex-row justify-center';


function determineWidthAccordingWithLengthOfName(name: string): string {
  let width:string = "w-32"; // Default width
  
  if (name.length > 20 && name.length <= 30) {
    width = "w-48 max-w-48";
  } else if (name.length > 30 && name.length <= 40) {
    width = "w-64 max-w-64";
  } else if (name.length > 40) {
    width = "w-96 max-w-96";
  }
  
  return width;
}

function determineHeightAccordingWithLengthOfName(name: string): string {
  let height:string = "h-12 max-h-12"; // Default height
  
  if (name.length > 20 && name.length <= 30) {
    height = "h-16 max-h-16";
  } else if (name.length > 30 && name.length <= 40) {
    height = "h-20 max-h-20";
  } else if (name.length > 40) {
    height = "h-24 max-h-24";
  }
  
  return height;
}


/**
 * 
 * @param numberOfRow Refers to the position of the row in the table. 
 * @param cellContainInformation This will be used to apply the style for cells with information.
 * @param titleOfRow Refers to the text of the first cell (title of row), this is different from the header (column) of the table, this will be used to ***calculate the width of the cell***.
 * @param titleOfColumn Refers to the text the header (column), this will be used to ***calculate the height of the cell***.
 */
export function determineRowStyle(numberOfRow: number, cellContainInformation: boolean, rightBorder: boolean, titleOfColumn: string|undefined, titleOfRow: string|undefined): string {
    let style:string = 'h-12 flex flex-row justify-center items-center';

    if (rightBorder) style += ' border-r';

    if (numberOfRow % 2 === 0) style += ' bg-gray-200';

    if (cellContainInformation) numberOfRow % 2 === 0 ? style += ' bg-amber-300' : style += ' bg-amber-200'

    if (titleOfColumn) style += ` ${determineWidthAccordingWithLengthOfName(titleOfColumn)}`;

    // if (titleOfRow) style += ` ${determineWidthAccordingWithLengthOfName(titleOfRow)}`;

    return style;
}

/**
 *
 * @param headerTitle Refers to the title of the column, this will be used to ***calculate the width of the cell***.
 * @param firstHeader Refers to the leftmost header, this will be used to ***calculate the height of the cell***.
 */
export function determineHeaderStyle(headerTitle: string, rightBorder: boolean, firstHeader: string|undefined): string {
    let style:string = 'h-12 flex flex-row justify-center items-center';

    if (rightBorder) style += ' border-r';

    // if (numberOfRow % 2 === 0) style += ' bg-gray-200';
    // // else style += ' bg-gray-100';

    if (headerTitle) style += ` ${determineWidthAccordingWithLengthOfName(headerTitle)}`;

    return style;
}