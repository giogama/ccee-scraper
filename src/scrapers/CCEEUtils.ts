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

export interface IQuadro {
    ContentFile: Blob;
    Description: string;
    Filename: string;
}

export async function getQuadroData(page: puppeteer.Page, frame:puppeteer.Frame, agent:IAgent, xPathLinkExportar:string, quadroNumero:string):Promise<IQuadro | null> {
	try {
        const linkExportar: puppeteer.ElementHandle<Element>[] = await frame.$x(xPathLinkExportar);

        //Consultar todos os Quadros disponíveis
        const quadros: puppeteer.ElementHandle<Element>[] = await frame.$x("//td[@id='Title' and starts-with(@title,'Quadro')]");
        if (quadros.length > 0){
            let indiceExportar:number = 0;
            let quadroExiste: boolean = false;

			for (let element of quadros) {
				const innerText:string = await getAttributeFromElement(element, "innerText");
				console.log(`innerText Quadro ${quadroNumero}: `, innerText);
                
                if (innerText.toString().toLowerCase().indexOf("quadro " + quadroNumero) >=0){
					console.log("encontrou o quadro " + quadroNumero);

                    if (indiceExportar < linkExportar.length) {
						console.log(`clicar quadro: ${quadroNumero}: `, innerText);
                        await linkExportar[indiceExportar].click();
                        quadroExiste=true;
                        break;
                    }
                }
                indiceExportar++;
			} 
            
            // quadros.forEach( async (element) => {
            //     const innerText:string = await getAttributeFromElement(element, "innerText");
			// 	console.log(`innerText Quadro ${quadroNumero}: `, innerText);
                
            //     if (innerText.toString().toLowerCase().indexOf("quadro " + quadroNumero) >=0){
			// 		console.log("encontrou o quadro " + quadroNumero);

            //         if (indiceExportar < linkExportar.length) {
			// 			console.log(`clicar quadro: ${quadroNumero}: `, innerText);
            //             await linkExportar[indiceExportar].click();
            //             quadroExiste=true;
            //             return false;
            //         }
            //     }
            //     indiceExportar++;
            // });
			console.log("saiu do forEach");

            if (quadroExiste)
            {
				console.log(`Quadro ${quadroNumero} foi encontrado`);
                await frame.waitForTimeout(1000);
				const elementExists: boolean = await isElementExists(frame, "//a[@id='popupMenuItem' and starts-with(@aria-label,'Excel 2007')]");

				if (elementExists) {
					const quadroUrl:string = await getAttributeFromPage(frame, "//a[@id='popupMenuItem' and starts-with(@aria-label,'Excel 2007')]", "onclick");

					console.log("Iniciar extrair a Url do evento onclick");
					let url: string = extractUrlFromLink(quadroUrl, agent.ParamValor2);
					url = url.replace("amp;","");
					console.log("url: ", url);

					const jCookies:puppeteer.Protocol.Network.GetAllCookiesResponse = await page.client().send("Network.getAllCookies");
					console.log("Cookies ", jCookies);

					const blobFile = await downloadFile(url, jCookies);
					const buffer = Buffer.from( await blobFile.arrayBuffer() );

                    fs.writeFile('arquivo.xlsx', buffer, () => console.log('arquivo salvo!') );					
				}				
            }
        }

        return null;
	} catch (err) {
	    throw err;
	}	
}