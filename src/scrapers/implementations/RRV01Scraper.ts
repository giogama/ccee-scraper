import { IAgent } from '../../configs/IScraperConfig';
import { loginCCEE, startBrowser } from '../PuppeteerUtils';
import { IScraperWeb } from "../IScraperWeb";
import * as puppeteer from 'puppeteer';

export class RRV01Scraper implements IScraperWeb {
    async start(agent: IAgent, ref: number): Promise<void>{
        const browser = await startBrowser();
        const page: puppeteer.Page = await browser.newPage();
        
        await page.goto(agent.Url, { waitUntil: 'networkidle2'});

        await loginCCEE(agent, page);

        await page.waitForTimeout(5000); // wait for 5 seconds
        await browser.close();
        console.log("Finalizado");
    }
}