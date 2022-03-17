import { RRV01Scraper } from '../../scrapers/implementations/RRV01Scraper';
import { ScraperRRVService } from './ScraperRRVService';
import { ScraperRRVController } from './ScraperRRVController'; 


const rrv01Scraper = new RRV01Scraper();
const scraperRRVService = new ScraperRRVService(rrv01Scraper);
const scraperRRVController = new ScraperRRVController(scraperRRVService);

export  { scraperRRVService, scraperRRVController };