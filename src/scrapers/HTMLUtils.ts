import puppeteer from 'puppeteer';
import { IAgent } from '../configs/IScraperConfig';

export async function locateId(frame:puppeteer.Frame):Promise<string> {
    let id: string =  "";

	try {
        const elementId: puppeteer.ElementHandle<Element>[] = await frame.$x("//div[starts-with(@id,'newLayout_saw_')]");

        if (elementId.length > 0){
            id = await elementId[0].evaluate(el => el.getAttribute("id"));
            //Exemplo: newLayout_saw_1239175_1
            const campos = id.split('_');            
            if (campos.length > 2)
                id = campos[2];
        }
        
        return id;
	} catch (err) {
	    throw err;
	}	
}

export async function locatePrefixoImageAnoMes(frame:puppeteer.Frame, id:string):Promise<string> {
    let idImg: string =  "";

	try {
        const elementId: puppeteer.ElementHandle<Element>[] = await frame.$x(`//input[starts-with(@id,'saw_${id}')]`);

        if (elementId.length > 0){
            idImg = await elementId[0].evaluate(el => el.getAttribute("id"));            
        }
        
        return idImg;
	} catch (err) {
	    throw err;
	}	
}

export async function locatePrefixoImageEvento(frame:puppeteer.Frame, id:string):Promise<string> {
    let idImg: string =  "";

	try {
        const elementId: puppeteer.ElementHandle<Element>[] = await frame.$x(`//input[starts-with(@id,'saw_${id}')]`);

        if (elementId.length > 1){
            idImg = await elementId[1].evaluate(el => el.getAttribute("id"));            
        }
        
        return idImg;
	} catch (err) {
	    throw err;
	}	
}

export async function clickAgenteListbox(frame:puppeteer.Frame, agent: IAgent):Promise<void> {
	try {
        const element: puppeteer.ElementHandle<Element>[] = await frame.$x(`//div[@class='listBoxPanelOptionBasic' and @title='${agent.ParamNome1}']/child::div`);

        if (!element || element.length == 0)
            throw new Error('Falha ao acessar Agente Listbox');                    
                            
        await element[0].click();
        
	} catch (err) {
	    throw err;
	}	
}

export async function locatePrefixoImagePerfil(frame:puppeteer.Frame, id:string):Promise<string> {
    let idImg: string =  "";

	try {
        let elementId: puppeteer.ElementHandle<Element>[] = await frame.$x(`//input[starts-with(@id,'saw_${id}')]`);

        if (elementId.length > 0){
            let idxPerfil:number = 3;
            if (elementId.length === 5) // Se tiver 5 dropdown
                idxPerfil = 2; //Pegar o terceiro (0-based index)

            idImg = await elementId[idxPerfil].evaluate(el => el.getAttribute("id"));                        
        }
        else
        {
            await frame.waitForTimeout(1000);
            const newId:string = await locateId(frame);

            elementId = await frame.$x(`//input[starts-with(@id,'saw_${newId}')]`);
            if (elementId.length > 0){
                let idxPerfil:number = 3;

                if (elementId.length === 5) // Se tiver 5 dropdown
                    idxPerfil = 2; //Pegar o terceiro (0-based index)

                idImg = await elementId[idxPerfil].evaluate(el => el.getAttribute("id"));                        
            }
        }        
        
        return idImg;
	} catch (err) {
	    throw err;
	}	
}

export async function getAttributeFromElement(elementIn:puppeteer.ElementHandle<Element>, attrName:string):Promise<string> {
    let attrValue: string =  "";

	try {
        attrValue = await (await elementIn.getProperty(attrName)).jsonValue();
        
        return attrValue;
	} catch (err) {
	    throw err;
	}	
}

export async function getAttributeFromPage(frame:puppeteer.Frame, xPath:string, attrName:string):Promise<string> {
    let attrValue: string =  "";

	try {
        const element: puppeteer.ElementHandle<Element>[] = await frame.$x(xPath);

        if (element.length > 0) {
            attrValue = await (await element[0].getProperty(attrName)).jsonValue();    
        }
        
        return attrValue;
	} catch (err) {
	    throw err;
	}	
}

export async function clickPerfilCheckbox(frame:puppeteer.Frame, agent: IAgent):Promise<void> {
	try {
        let selectPerfil: puppeteer.ElementHandle<Element>[] = await frame.$x(`//div//label[@class='checkboxRadioButtonLabel' and text()='${agent.ParamNome1}']`);

        if (selectPerfil.length > 0)        
            await selectPerfil[0].click();
        else
        {
            await frame.waitForTimeout(5000);
            selectPerfil = await frame.$x(`//div//label[@class='checkboxRadioButtonLabel' and text()='${agent.ParamNome1}']`);
            await selectPerfil[0].click();
        }
	} catch (err) {
	    throw err;
	}	
}

export async function isElementExists(frame:puppeteer.Frame, xPath:string):Promise<boolean> {
	try {
        if (await (await frame.$x(xPath)).length > 0) 
            return true;
        else 
            return false;

	} catch (err) {
	    throw err;
	}	
}

export interface IElementExists {
    Exists: boolean;
    XPath: string;
}

export async function isElementsExists(frame:puppeteer.Frame, xPath1:string, xPath2:string):Promise<IElementExists> {
    let exists:boolean = false;
    let xPathEncontrado: string = xPath1;

	try {
        if (await (await frame.$x(xPath1)).length > 0) {
            exists = true;
        }
        else if (await (await frame.$x(xPath2)).length > 0) {
            exists = true;
            xPathEncontrado = xPath2;
        }

        return {Exists: exists, XPath: xPathEncontrado};
	} catch (err) {
	    throw err;
	}	
}

export function extractUrlFromLink(text:string, urlBase:string):string {
    let url:string = "";

	try {
        if (text) {
            const campos = text.split('\'');            
            if (campos.length > 1)
            url = urlBase + campos[1];
        }

        return url;

	} catch (err) {
	    throw err;
	}	
}
