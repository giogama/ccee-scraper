import puppeteer from 'puppeteer';
import { IAgent } from '../configs/IScraperConfig';


export async function getAttributeFromElement(elementIn:puppeteer.ElementHandle<Element>, attrName:string):Promise<string> {
    let attrValue: string =  "";

	try {
        attrValue = await (await elementIn.getProperty(attrName)).jsonValue();
        
        return attrValue;
	} catch (err) {
	    throw err;
	}	
}

export async function getAttributeFromPage(frame:puppeteer.Frame, selector:string, attrName:string, indexElement:number):Promise<string> {
    let attrValue: string =  "";

	try {

        //attrValue = await frame.evaluate(`document.querySelector("a[id=popupMenuItem][aria-label^='Excel 2007']").getAttribute('onclick')`);        
        attrValue = await frame.evaluate(`document.querySelectorAll("${selector}")[${indexElement}].getAttribute('${attrName}')`);        
        
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
            const campos = text.toString().split("'");            
            if (campos.length > 1)
            url = urlBase + campos[1];
            url = url.toString().replace("amp;","");					
        }

        return url;

	} catch (err) {
	    throw err;
	}	
}
