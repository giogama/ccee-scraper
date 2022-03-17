import { IScraperWeb } from '../../scrapers/IScraperWeb';
import fs from 'fs';
import path from 'path';

export class ScraperRRVService {
    constructor(
        private scrape: IScraperWeb
    ){}

    async execute(robotId: number, cnpj: string): Promise<void> {
        const rawdata = fs.readFileSync(path.resolve(__dirname, '..', '..', 'scraper-config.json'));
        const config = JSON.parse(rawdata.toString());

        console.log(robotId, cnpj);

        const agent = config.ServiceConfigurations.find(a => a.id == robotId);
        
        console.log(agent);

        //this.scrape.start()
    }
}