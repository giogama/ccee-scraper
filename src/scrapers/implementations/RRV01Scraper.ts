import { IAgent } from '../../configs/IAgent';
import { startBrowser } from '../browser';
import { IScraperWeb } from "../IScraperWeb";

export class RRV01Scraper implements IScraperWeb {
    async start(agent: IAgent, ref: number): Promise<void>{
        const browser = await startBrowser();
        const page = await browser.newPage();
        
        await page.goto(agent.url, { waitUntil: 'networkidle2'});
        //await browser.close();
    }
}