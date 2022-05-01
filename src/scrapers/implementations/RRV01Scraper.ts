import { IAgent, IEmailSettings } from '../../configs/IScraperConfig';
import { loginCCEE, startBrowser, processToken, navigateToDashboard, getNumberQuadros, getQuadroData } from '../CCEEUtils';
import { locateId, locatePrefixoImageAnoMes, locatePrefixoImageEvento, 
         clickAgenteListbox, locatePrefixoImagePerfil, 
         clickPerfilCheckbox, getAttributeFromElement, 
         isElementExists, IElementExists, isElementsExists } from '../HTMLUtils';
import { IScraperWeb } from "../IScraperWeb";
import { IMailProvider } from '../../providers/IMailProvider';
import * as puppeteer from 'puppeteer';

import fs from 'fs';

export class RRV01Scraper implements IScraperWeb {
    
    constructor(
        private mailProvider: IMailProvider
    ){}

    async start(agent: IAgent, mailSettings: IEmailSettings, ref: number): Promise<void>{
        let browserOpen:boolean = false;
        let browser: puppeteer.Browser;

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
            
            //Localizar ID            
            let id:string = await locateId(frame);
            let mensagemRetorno: string = "";

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
                        throw new Error('Falha ao acessar Combo AnoMes');                    
                    
                    await selectAnoMes[0].click();

                    //COLOCAR VERIFICADOR SE A PAGINA FOI CARREGADA (DEMORA PRA ABRIR)
                    await frame.waitForTimeout(7000);

                    //Localizar novo ID para selecionar o evento
                    id = await locateId(frame);
                    if (id !== "")
                    {
                        //Buscar id input do evento que será o prefixo do id da imagem
                        await frame.waitForTimeout(1000);
                        idImg = await locatePrefixoImageEvento(frame, id);

                        //Imagem dropdown evento
                        await frame.click(`#${idImg}_dropdownIcon`);
                        await frame.waitForTimeout(6000);

                        //Selecionar Evento
                        anomes = ref.toString().substring(0, 4) + "_" + ref.toString().substring(4, 6);                
                        elementExists = await isElementExists(frame, `//span[@class='promptMenuOptionText' and text()='${anomes}_${agent.ParamValor4}']`);                
                        if (elementExists)
                        {
                            const selectEvento:puppeteer.ElementHandle<Element>[] = await frame.$x(`//span[@class='promptMenuOptionText' and text()='${anomes}_${agent.ParamValor4}']`);            
                            if (!selectEvento || selectEvento.length == 0)
                                throw new Error('Falha ao acessar Combo Evento');                    
                            
                            await selectEvento[0].click();
                            await frame.waitForTimeout(4000);

                            // Selecionar Agente
                            await clickAgenteListbox(frame, agent);
                            await frame.waitForTimeout(1000);

                            //Localizar novo ID para selecionar o Perfil
                            id = await locateId(frame);
                            if (id !== "")
                            {
                                let repeater = 0;
                                do {
                                    //Localizar novamente o ID para selecionar o Perfil
                                    id = await locateId(frame);
                                    await frame.waitForTimeout(1000);

                                    //Id Imagem Perfil
                                    idImg = await locatePrefixoImagePerfil(frame, id);

                                    //Imagem dropdown Perfil
                                    await frame.click(`#${idImg}_dropdownIcon`);
                                    await frame.waitForTimeout(6000);

                                    //Selecionar Perfil
                                    elementExists = await isElementExists(frame, `//div//label[@class='checkboxRadioButtonLabel' and text()='${agent.ParamNome1}']`);                                                    
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
                                            throw new Error("RRV001 - Falha obter referência ao elemento Perfil.");
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

                                if (repeater != 0)
                                {
                                    await page.close();
                                    throw new Error("RRV001 - Falha ao acessar o Dropdown list Perfil.");
                                }

                                //Botão Aplicar
                                console.log("botão aplicar");
                                await frame.click("#gobtn");
                                await frame.waitForTimeout(30000);

                                //BLOCO INICIO
                                const elementsExists: IElementExists = await isElementsExists(frame, "//a[@name='ReportLinkMenu' and @title='Exportar para formato diferente']", "//a[@name='ReportLinkMenu' and @title='Export to different format']" );
                                if (elementsExists.Exists)
                                { 
                                    const quadros:number = await getNumberQuadros(frame); 

                                    for (let i=1; i<=quadros; i++){
                                        console.log("iniciar download quador ", i);                                  
                                        await getQuadroData(page, frame, agent, elementsExists.XPath, i.toString());
                                        await frame.waitForTimeout(1000);
                                    }                                    
                                    console.log("concluído download dos quadros");
                                }
                                else
                                    mensagemRetorno = `RRV001 ${agent.ParamValor5} - Nenhum quadro disponível.`;            
                            }
                            else
                                mensagemRetorno = `RRV001 ${agent.ParamValor5} - Evento: ${anomes} - perfil não pode ser localizado.`;        
                        }
                        else
                            mensagemRetorno = `RRV001 ${agent.ParamValor5} - Evento: ${anomes} - ${agent.ParamValor4} não disponível`;    
                    }
                    else
                        mensagemRetorno = `RRV001 ${agent.ParamValor5} - não foi possível obter o id html do evento. Falha de Scraping`;
                }
                else
                    mensagemRetorno = `RRV001 ${agent.ParamValor5} - Referência: ${anomes} não disponível`;
            }

            console.log(mensagemRetorno);
            await frame.waitForTimeout(40000); // wait for 40 seconds
            //await browser.close();
            console.log("Finalizado");
        }
        catch(err) {            
            //  if (browserOpen)
            //      browser.close();

            console.log("Finalizado com erro: ", err);
            throw err;
        }
    }
}