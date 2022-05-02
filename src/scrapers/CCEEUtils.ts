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
}export async function locateId(frame:puppeteer.Frame):Promise<string> {
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

export async function selectReferencia(frame:puppeteer.Frame, agent:IAgent, ref: number): Promise<string>{
	let mensagemRetorno: string = "";

	try {
		//Localizar ID            
        let id:string = await locateId(frame);

		if (id !== "")
		{
			//Id Imagem AnoMes
			await frame.waitForTimeout(1000);
			let idImg:string = await locatePrefixoImageAnoMes(frame, id);                

			//Imagem dropdown ano_mes                
			await frame.click(`#${idImg}_dropdownIcon`);
			await frame.waitForTimeout(7000);

			//Selecionar o ano/mes da lista
			let anomes: string = ref.toString().substring(0, 4) + "/" + ref.toString().substring(4, 6);                
			let elementExists: boolean = await isElementExists(frame, `//div//span[@class='promptMenuOptionText' and text()='${anomes}']`);                
			
			if (elementExists)
			{
				const selectAnoMes:puppeteer.ElementHandle<Element>[] = await frame.$x(`//div//span[@class='promptMenuOptionText' and text()='${anomes}']`);            
				if (!selectAnoMes || selectAnoMes.length == 0)
					mensagemRetorno = 'Falha ao acessar Combo AnoMes';    
				else 
				{
					await selectAnoMes[0].click();

					//COLOCAR VERIFICADOR SE A PAGINA FOI CARREGADA (DEMORA PRA ABRIR)
					await frame.waitForTimeout(7000);
				}                
			}
			else
				mensagemRetorno = `RRV001 ${agent.ParamValor5} - Evento: ${anomes} - ${agent.ParamValor4} não disponível`;
		}
		else
			mensagemRetorno = `RRV001 ${agent.ParamValor5} - falhar ao localizar o Id no Html.`;

		return mensagemRetorno;
	} catch (err) {
		throw err;
	}
}

export async function selectEvento(frame:puppeteer.Frame, agent:IAgent, ref: number): Promise<string>{
	let mensagemRetorno: string = "";

	try {
		//Localizar ID            
        let id:string = await locateId(frame);
            
		//Localizar novo ID para selecionar o evento
		id = await locateId(frame);
		if (id !== "")
		{
			//Buscar id input do evento que será o prefixo do id da imagem
			await frame.waitForTimeout(1000);
			const idImg = await locatePrefixoImageEvento(frame, id);

			//Imagem dropdown evento
			await frame.click(`#${idImg}_dropdownIcon`);
			await frame.waitForTimeout(6000);

			//Selecionar Evento
			const anomes = ref.toString().substring(0, 4) + "_" + ref.toString().substring(4, 6);                
			const elementExists = await isElementExists(frame, `//span[@class='promptMenuOptionText' and text()='${anomes}_${agent.ParamValor4}']`);
			if (elementExists)
			{
				const selectEvento:puppeteer.ElementHandle<Element>[] = await frame.$x(`//span[@class='promptMenuOptionText' and text()='${anomes}_${agent.ParamValor4}']`);            
				if (!selectEvento || selectEvento.length == 0)
					mensagemRetorno = 'Falha ao acessar Combo Evento';     
				else {
					await selectEvento[0].click();
					await frame.waitForTimeout(4000);
				}               
			}
			else
				mensagemRetorno = `RRV001 ${agent.ParamValor5} - Evento: ${anomes} - ${agent.ParamValor4} não disponível`;
		}
		else
			mensagemRetorno = `RRV001 ${agent.ParamValor5} - falhar ao localizar o Id no Html.`;

		return mensagemRetorno;
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

export async function selectPerfil(page: puppeteer.Page, frame:puppeteer.Frame, agent:IAgent): Promise<string>{
	let mensagemRetorno: string = "";

	try {
		//Localizar ID            
        let id:string = await locateId(frame);
            
		//Localizar novo ID para selecionar o evento
		id = await locateId(frame);
		if (id !== "")
		{
			let repeater = 0;
			do {
				//Localizar novamente o ID para selecionar o Perfil
				id = await locateId(frame);
				await frame.waitForTimeout(1000);

				//Id Imagem Perfil
				let idImg = await locatePrefixoImagePerfil(frame, id);

				//Imagem dropdown Perfil
				await frame.click(`#${idImg}_dropdownIcon`);
				await frame.waitForTimeout(6000);

				//Selecionar Perfil
				const elementExists = await isElementExists(frame, `//div//label[@class='checkboxRadioButtonLabel' and text()='${agent.ParamNome1}']`);                                                    
				if (elementExists)
				{
					let chkPerfil:puppeteer.ElementHandle<Element> = await frame.$(`input[name='${idImg}'][value='${agent.ParamNome1}'][type='checkbox']`);
					if (chkPerfil === null){
						await frame.waitForTimeout(1000);
						id = await locateId(frame);
						await frame.waitForTimeout(1000);
						idImg = await locatePrefixoImagePerfil(frame, id);
						chkPerfil = await frame.$(`input[name='${idImg}'][value='${agent.ParamNome1}'][type='checkbox']`);
					}                                        

					if (chkPerfil === null){
						await page.close();
						mensagemRetorno = "RRV001 - Falha obter referência ao elemento Perfil.";
						break;
					}
					
					

					const checkedValue:string = await getAttributeFromElement(chkPerfil, "checked");                                        

					if (checkedValue !== null){
						if (checkedValue.toString().toLowerCase() !== "true")
						{
							await frame.waitForTimeout(2000);
							await clickPerfilCheckbox(frame, agent);
							await frame.waitForTimeout(2000);
						}
					}
					else
					{
						await frame.waitForTimeout(2000);
						await clickPerfilCheckbox(frame, agent);
						await frame.waitForTimeout(2000);
					}

					//Desmcarcar Combo Pertil
					await frame.click(`#${idImg}_dropdownIcon`);
					await frame.waitForTimeout(6000);
					repeater = 0;
					break;
				}
				else
					repeater++;

			} while(repeater <= 2);

			if (mensagemRetorno !== "")
			{
				if (repeater != 0)
				{
					await page.close();
					mensagemRetorno = "RRV001 - Falha ao acessar o Dropdown list Perfil.";
				}
			}
		}
		else
            mensagemRetorno = `RRV001 ${agent.ParamValor5} - perfil não pode ser localizado.`; 

		return mensagemRetorno;
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