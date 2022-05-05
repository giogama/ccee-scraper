import { IScraperConfig } from "../configs/IScraperConfig";
import { IScrapingResponse } from "../scrapers/CCEEUtils";

export interface IPostCCEEDataResponse {    
    isSucesso:boolean;
    isAlerta:boolean;
    isError:boolean;
    message:string;
}

export interface IDataCenterProvider {    
    getLastReference(idRobot:number, cnpj:string, appKey:string, userId:string, accessKey:string, url:string): Promise<number>;    
    isCCEEExists(idRobot:number, cnpj:string, reference:number, config: IScraperConfig): Promise<boolean>;
    PostCCEEData(robotId:number, reference:number, cnpj:string,  description:string, model:IScrapingResponse, config: IScraperConfig): Promise<IPostCCEEDataResponse>;
    PostMonitorData(tipo:number, idLocal:string, idRobo:number, parametros:string, resumo:string, detalhes:string, host:string, hostConfig:string, userAgent:string, versao:string, config: IScraperConfig): Promise<string>;
}
