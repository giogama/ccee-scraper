import { IAgent } from "../configs/IAgent";


export interface IScraperWeb {
    start(agent: IAgent, ref: number): Promise<void>;
}