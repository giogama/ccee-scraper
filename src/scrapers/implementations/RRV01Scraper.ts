import { startBrowser } from '../browser';
import { IAgent, IScraperWeb } from "../IScraperWeb";

export class RRV01Scraper implements IScraperWeb {
    async scraper(agent: IAgent, ref: number): Promise<void>{
        const browser = await startBrowser();
        const page = await browser.newPage();
        
        await page.goto(agent.url, { waitUntil: 'networkidle2'});
        await browser.close();
    }
}