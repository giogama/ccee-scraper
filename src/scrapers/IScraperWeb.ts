import { IAgent } from "../configs/IScraperConfig";


export interface IScraperWeb {
    start(agent: IAgent, ref: number): Promise<void>;
}