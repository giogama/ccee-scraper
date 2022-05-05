
function zeroPad(num:number, places:number):string {
    let zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num;
  }

export function referenceAdd(reference:number, numMeses:number):number {  
    try {

        if (reference.toString().length === 6)
        {
            let ano:number = Number.parseInt(reference.toString().substring(0, 4));
            let mes:number = Number.parseInt(reference.toString().substring(5, 6));
            const sinal = numMeses < 0 ? -1: 1;

            for (let i = 1; i <= Math.abs(numMeses); i++){
                mes = mes + (1 * sinal);

                if (mes === 0) {
                    mes = 12;
                    ano = ano - 1;
                }
                else if (mes === 13) {
                    mes = 1;
                    ano = ano + 1;
                }
            }

            return Number.parseInt(zeroPad(ano,4) + zeroPad(mes,2));
        }
    }
    catch (err) {
        throw err;
    }
}

export function getCurrentReference():number {  
    try {
        const currentTime = new Date();
        const ano:number = currentTime.getFullYear();        
        const mes:number = currentTime.getMonth() + 1;

        return Number.parseInt(zeroPad(ano,4) + zeroPad(mes,2));
    }
    catch (err) {
        throw err;
    }
}

export function removeEnterAndLineFeedCharacters(text:string):string {
    return  text.replaceAll(/\r\n?|\n/g, "");
}