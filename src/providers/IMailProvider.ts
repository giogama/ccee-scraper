import { IEmailSettings } from '../configs/IScraperConfig';

export interface IMailProvider {    
    getTokenInEmail(settings:IEmailSettings): Promise<string[]>;    
}

