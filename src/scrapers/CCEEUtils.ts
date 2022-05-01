import puppeteer from 'puppeteer';
import { IAgent, IEmailSettings } from '../configs/IScraperConfig';
import { IMailProvider } from '../providers/IMailProvider';
import { getAttributeFromElement, getAttributeFromPage, isElementExists, extractUrlFromLink } from './HTMLUtils';
import fs from 'fs';
import { downloadFile } from './HttpUtils';

export async function startBrowser(){
	let browser: puppeteer.Browser;

	try {
	    console.log("Opening the browser......");
	    browser = await puppeteer.launch({
	        headless: false,
	        args: [
				"--no-sandbox",
				"--disable-setuid-sandbox",
				"--disable-web-security",								
				"--disable-features=IsolateOrigins,site-per-process",                            
			],
			ignoreHTTPSErrors: true	        
	    });
	} catch (err) {
	    console.log("Could not create a browser instance => : ", err);
	}
	return browser;
}

export async function loginCCEE(agent:IAgent, page: puppeteer.Page){
	try {
		await page.waitForTimeout(5000);
		await page.type('#mat-input-0', agent.Login);
		await page.type('#mat-input-1', agent.Senha);

		const submit:puppeteer.ElementHandle[] = await page.$x("//button[starts-with(@class,'mat-flat-button w-100 clr-white mat-button mat-accent')]");
		await submit[0].click();
	} catch (err) {
	    console.log("Could not login on CCEE => : ", err);
	}
	return page;
}

export async function processToken(agent:IAgent,  page: puppeteer.Page, settings: IEmailSettings, mailProvider: IMailProvider){
	try {
		if (agent.HasToken)
		{
			await page.waitForTimeout(10000);
			
			//Apagar e-mails
			//TODO

			//Enviar token por e-mail
			console.log("Search for token in e-mail ......");
			const buttonEmail:puppeteer.ElementHandle[] = await page.$x("//input[starts-with(@value,'E-mail')]");
			await buttonEmail[0].click();

			//Aguardar o Token chegar no e-mail
			await page.waitForTimeout(12000);

			//Buscar o token no e-mail
			const token: string[] = await mailProvider.getTokenInEmail(settings);

			//Preencher Token
			if (token.length > 0) {
				await page.type('#campoColetaUsuario', token[0]);

				//Enviar token
				await page.click("#enviar");
			}
			else
			{
				throw new Error("Não retornou nenhum Token enviado para o e-mail");
			}
		}
	} catch (err) {
	    //console.log("Could not login on CCEE => : ", err);
		throw err;
	}
	return page;
}

export async function navigateToDashboard(agent:IAgent,  page: puppeteer.Page): Promise<puppeteer.Frame>{
	try {
			//Esperar o IFrame
			await page.waitForSelector("iframe[src='https://operacao.ccee.org.br/analytics']", { timeout: 99000});

			const frameElement: puppeteer.ElementHandle<Element> = await page.$("iframe[src='https://operacao.ccee.org.br/analytics']");			

			if (!frameElement)
				throw new Error("Frame não encontrado. Verificar a página.");

			const frame: puppeteer.Frame = await frameElement.contentFrame();

			//Esperar até que o iFrame este carregado
			await frame.waitForSelector("#idHeaderTitleCell", { timeout: 120000});

			//Clicar Menu Dashboad (Painéis)
			await frame.waitForSelector("#dashboard", { timeout: 120000})
			await frame.click("#dashboard");
			await frame.waitForTimeout(25000);
			
			return frame;
	} catch (err) {
		throw err;
	}
}

export async function selectReferencia(frame:puppeteer.Frame, agent:IAgent): Promise<void>{
	try {
			//Localizar ID            
            let id:string = await locateId(frame);
            let mensagemRetorno: string = "";
	} catch (err) {
		throw err;
	}
}

export async function getNumberQuadros(frame:puppeteer.Frame):Promise<number> {
	try {
        return await frame.evaluate(`document.querySelectorAll("td[id='Title'][title^='Quadro']").length`);        
	} catch (err) {
	    throw err;
	}	
}

export interface IDownload {
    ContentFile: string;
    Description: string;
    Filename: string;
	Extension: string;
}

export async function getQuadroData(page: puppeteer.Page, frame:puppeteer.Frame, agent:IAgent, xPathLinkExportar:string, quadroNumero:string):Promise<IDownload | null> {
	try {
        const linkExportar: puppeteer.ElementHandle<Element>[] = await frame.$x(xPathLinkExportar);

        //Consultar todos os Quadros disponíveis
        const quadros: puppeteer.ElementHandle<Element>[] = await frame.$x("//td[@id='Title' and starts-with(@title,'Quadro')]");
        if (quadros.length > 0) {
            let indiceExportar:number = 0;
            let quadroExiste: boolean = false;
			let descriptionQuadro: string = "";

			for (let element of quadros) {
				const innerText:string = await getAttributeFromElement(element, "innerText");			
                
                if (innerText.toString().toLowerCase().indexOf("quadro " + quadroNumero) >=0){				
					descriptionQuadro = innerText;					

                    if (indiceExportar < linkExportar.length) {	
						await frame.waitForTimeout(1000);
                        await frame.click("body");

						await frame.waitForTimeout(1000);
                        await linkExportar[indiceExportar].click();
                        quadroExiste=true;
                        break;
                    }
                }
                indiceExportar++;
			}                        

            if (quadroExiste)
            {				
                await frame.waitForTimeout(1000);
				const elementExists: boolean = await isElementExists(frame, "//a[@id='popupMenuItem' and starts-with(@aria-label,'Excel 2007')]");

				if (elementExists) {
					const quadroUrl:string = await getAttributeFromPage(frame, "a[id=popupMenuItem][aria-label^='Excel 2007']", "onclick", indiceExportar);
					
					let url: string = extractUrlFromLink(quadroUrl, agent.ParamValor2);

					const jCookies:puppeteer.Protocol.Network.GetAllCookiesResponse = await page.client().send("Network.getAllCookies");

					if (url !== ""){									
						const downloadQuadro: IDownload  = await downloadFile(descriptionQuadro,url, jCookies);
						if (downloadQuadro) {
							console.log("Filename: ", downloadQuadro.Filename);
						}
					}
				}				
            }
        }		

        return null;
	} catch (err) {
	    throw err;
	}	
}