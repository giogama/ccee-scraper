import { IAgent, IEmailSettings } from "../configs/IScraperConfig";


export interface IScraperWeb {
    start(agent: IAgent, mailSettings: IEmailSettings, ref: number): Promise<void>;
}