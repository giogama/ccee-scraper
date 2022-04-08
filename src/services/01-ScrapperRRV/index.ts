import { GmailMailProvider } from '../../providers/implementations/GmailMailProvider';
import { RRV01Scraper } from '../../scrapers/implementations/RRV01Scraper';
import { ScraperRRVService } from './ScraperRRVService';
import { ScraperRRVController } from './ScraperRRVController'; 


const gmailProvider = new GmailMailProvider();
const rrv01Scraper = new RRV01Scraper(gmailProvider);
const scraperRRVService = new ScraperRRVService(rrv01Scraper);
const scraperRRVController = new ScraperRRVController(scraperRRVService);

export  { scraperRRVService, scraperRRVController };