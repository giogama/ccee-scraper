import { IScraperWeb } from '../../scrapers/IScraperWeb';
import fs from 'fs';
import path from 'path';
import { IScraperConfig, IAgent } from '../../configs/IScraperConfig';

export class ScraperRRVService {
    constructor(
        private scrape: IScraperWeb
    ){}

    async execute(robotId: number, cnpj: string): Promise<void> {
        try {
            const rawdata = fs.readFileSync(path.resolve(__dirname, '..', '..', 'configs', 'scraper-config.json'));
            const config: IScraperConfig = JSON.parse(rawdata.toString());
    
            const agent: IAgent[] = config.ServiceConfigurations.Agents.filter(a => a.Id === robotId && a.CNPJ === cnpj);
    
            if (agent.length === 0){
                throw new Error(`Robot: ${robotId} and CNPJ: ${cnpj} not found.`);
            }
    
            await this.scrape.start(agent[0], 202202);

        } catch (err){
            throw err;
        }
    }
}