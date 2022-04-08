import { IAgent, IEmailSettings } from '../../configs/IScraperConfig';
import { loginCCEE, startBrowser, processToken } from '../PuppeteerUtils';
import { IScraperWeb } from "../IScraperWeb";
import { IMailProvider } from '../../providers/IMailProvider';
import * as puppeteer from 'puppeteer';

export class RRV01Scraper implements IScraperWeb {
    
    constructor(
        private mailProvider: IMailProvider
    ){}

    async start(agent: IAgent, mailSettings: IEmailSettings, ref: number): Promise<void>{
        const browser = await startBrowser();
        const page: puppeteer.Page = await browser.newPage();
        
        await page.goto(agent.Url, { waitUntil: 'networkidle2'});

        await loginCCEE(agent, page);

        await processToken(agent, page, mailSettings, this.mailProvider);

        await page.waitForTimeout(5000); // wait for 5 seconds
        await browser.close();
        console.log("Finalizado");
    }
}