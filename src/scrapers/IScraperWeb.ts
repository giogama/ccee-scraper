import { IAgent, IEmailSettings } from "../configs/IScraperConfig";
import { IScrapingResponse } from "./CCEEUtils";


export interface IScraperWeb {
    start(agent: IAgent, mailSettings: IEmailSettings, ref: number): Promise<IScrapingResponse>;
}