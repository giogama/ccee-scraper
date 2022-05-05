import { IAgent, IEmailSettings } from '../../configs/IScraperConfig';
import { loginCCEE, startBrowser, processToken, navigateToDashboard, 
         clickAgenteListbox, getNumberQuadros, getQuadroData, 
         selectReferencia, selectEvento, selectPerfil, IScrapingResponse, IDownload} from '../CCEEUtils';
import { IElementExists, isElementsExists } from '../HTMLUtils';
import { IScraperWeb } from "../IScraperWeb";
import { IMailProvider } from '../../providers/IMailProvider';
import * as puppeteer from 'puppeteer';

import fs from 'fs';

export class RRV01Scraper implements IScraperWeb {
    
    constructor(
        private mailProvider: IMailProvider
    ){}

    async start(agent: IAgent, mailSettings: IEmailSettings, ref: number): Promise<IScrapingResponse>{
        let browserOpen:boolean = false;
        let browser: puppeteer.Browser;
        let response: IScrapingResponse = {
            HasError: false,
            Message: "",    
	        Documents: null
        };
        

        try {
            browser = await startBrowser();
            browserOpen =true;
            const page: puppeteer.Page = await browser.newPage();
            
            await page.goto(agent.Url, { waitUntil: 'networkidle2'});
    
            await loginCCEE(agent, page);
    
            await processToken(agent, page, mailSettings, this.mailProvider);

            //COLOCAR VERIFICADOR SE A PAGINA FOI CARREGADA (DEMORA PRA ABRIR)
            await page.waitForTimeout(25000);

            console.log("Acessar Dashboard ...");
            const frame: puppeteer.Frame = await navigateToDashboard(agent, page);   
            

            //-------------------------------------------------------------------------------------------------------
            //INÍCIO RRV001 (PRELIMINAR E FINAL)
            //-------------------------------------------------------------------------------------------------------

            //Fecha Submenu - Contratacao de Energia            
            const mnuContratacao:puppeteer.ElementHandle<Element>[] = await frame.$x("//a[@aria-label='2.Contratacao de Energia']");
            if (!mnuContratacao)
                throw new Error('Falha ao acessar o menu: 2.Contratacao de Energia');
            await mnuContratacao[0].click();
            await frame.waitForTimeout(1000);

            //Abrir Submenu - 8.RRV            
            const mnuSubMenu:puppeteer.ElementHandle<Element>[] = await frame.$x("//a[@aria-label='8.RRV']");
            if (!mnuSubMenu  || mnuSubMenu.length == 0)
                throw new Error('Falha ao acessar o menu: 8.RRV');
            await mnuSubMenu[0].click();
            await frame.waitForTimeout(1000);

            //Botão Receita de Venda            
            const cmdReserva:puppeteer.ElementHandle<Element>[] = await frame.$x("//a[@aria-label='Receita de Venda']");
            if (!cmdReserva  || cmdReserva.length == 0)
                throw new Error('Falha ao acessar o menu: Receita de Venda');
            await cmdReserva[0].click();
            await frame.waitForTimeout(5000);            
            
            
            const mnuAba:puppeteer.ElementHandle<Element>[] = await frame.$x("//div[contains(text(),'RV001 - Receita de Venda Consolidada Mensal e Ajustes')]");            
            if (!mnuAba || mnuAba.length == 0)
                throw new Error('Falha ao acessar a Tab: RV001 - Receita de Venda Consolidada Mensal e Ajustes');
            await mnuAba[0].click();
            await frame.waitForTimeout(5000);
            
            let mensagemRetorno: string = "";
            
            //---------------------------------
            mensagemRetorno = await selectReferencia(frame, agent, "RRV001 ", ref);
            if (mensagemRetorno === "")
            {
                mensagemRetorno = await selectEvento(frame, agent, "RRV001 ", ref);

                if (mensagemRetorno === "")
                {
                    // Selecionar Agente
                    await clickAgenteListbox(frame, agent);
                    await frame.waitForTimeout(1000);

                    mensagemRetorno = await selectPerfil(page, frame, agent, "RRV001 - ");
                    if (mensagemRetorno === "")
                    {
                        //Botão Aplicar
                        await frame.click("#gobtn");
                        await frame.waitForTimeout(30000);

                        //BLOCO INICIO
                        const elementsExists: IElementExists = await isElementsExists(frame, "//a[@name='ReportLinkMenu' and @title='Exportar para formato diferente']", "//a[@name='ReportLinkMenu' and @title='Export to different format']" );
                        if (elementsExists.Exists)
                        { 
                            const quadros:number = await getNumberQuadros(frame); 

                            for (let i=1; i<=quadros; i++){
                                console.log("iniciar download quador ", i);                                  
                                const document: IDownload = await getQuadroData(page, frame, agent, elementsExists.XPath, `RRV001 ${agent.ParamValor5} - Quadro ${i}`, i.toString());
                                await frame.waitForTimeout(1000);
                                if (document != null) {

                                    if (i===1)
                                    {
                                        response.Documents = [];    
                                    }

                                    response.Documents.push(document); 
                                }
                                    
                            }                                    
                            console.log("concluído download dos quadros");
                        }
                        else
                            mensagemRetorno = `RRV001 ${agent.ParamValor5} - Nenhum quadro disponível.`; 
                    }
                }
            }
            //---------------------------------
            if (mensagemRetorno !== ""){
                response.HasError = false;
                response.Message = mensagemRetorno;
                response.Documents = null;
            }
            else
            {
                response.HasError = false;
                response.Message = "";
            }
            
            await frame.waitForTimeout(10000); // wait for 40 seconds
            await browser.close();
        }
        catch(err) {   
            response.HasError = true;
            response.Message = err;
            response.Documents = null;

             if (browserOpen)
                 browser.close();
        }

        return response;
    }
}