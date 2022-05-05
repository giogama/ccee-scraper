import { IScraperWeb } from '../../scrapers/IScraperWeb';
import fs from 'fs';
import path from 'path';
import { IScraperConfig, IAgent } from '../../configs/IScraperConfig';
import { IScrapingResponse } from '../../scrapers/CCEEUtils';
import { IDataCenterProvider, IPostCCEEDataResponse  } from '../../providers/IDataCenterProvider';
import { getCurrentReference, referenceAdd } from '../Helpers/CommonHelper';

export interface IServiceResponse {
    message:string;
    notificationType:number;
    notificationMessage:string;
    hasError:boolean;
}

export class ScraperRRVService {
    constructor(
        private scrape: IScraperWeb,
        private dataCenterApi: IDataCenterProvider
    ){}

    async execute(robotId: number, cnpj: string, reference:number = 0): Promise<IServiceResponse> {
        let referenceScraping:number;
        let mensagem:string = "sucesso";
        let agentId:number = 0;
        let agentNome:string = "";
        let agentEmpresa:string = "";
        let versao:string = "";
        let config: IScraperConfig = null;
        let messageRef:string = "";
        let serviceResponse:IServiceResponse = {} as IServiceResponse;

        try {
            const rawdata = fs.readFileSync(path.resolve(__dirname, '..', '..', 'configs', 'scraper-config.json'));
            config = JSON.parse(rawdata.toString());
            const currentReference: number = getCurrentReference();
    
            const agent: IAgent[] = config.ServiceConfigurations.Agents.filter(a => a.Id === robotId && a.CNPJ === cnpj);
    
            if (agent.length === 0){
                throw new Error(`Robot: ${robotId} and CNPJ: ${cnpj} not found.`);
            }

            agentId = agent[0].Id;
            agentNome = agent[0].Nome;
            agentEmpresa = agent[0].Empresa;
            versao = config.ServiceConfigurations.Versao;

            if (reference === 0)
            {
                const ref:number = await this.dataCenterApi.getLastReference(robotId, cnpj, 
                    config.ServiceConfigurations.AppKey, config.ServiceConfigurations.UserId,
                    config.ServiceConfigurations.AccessKey, config.ServiceConfigurations.Url);
                
                if (ref > 0) {
                    referenceScraping = ref;                                        
                }
                else {
                    referenceScraping = referenceAdd(getCurrentReference(), -2);                    
                }

                if (!agent[0].Sobreescrever && referenceScraping === reference) {
                    throw new Error("Os documentos desta referência já foi baixada.");
                }

                //Proxima Referênciação
                referenceScraping = referenceAdd(referenceScraping, 1);
            }
            else {
                referenceScraping = reference;

                if (!agent[0].Sobreescrever)
                {                    
                    const cceeExists:boolean = await this.dataCenterApi.isCCEEExists(robotId, cnpj, reference, config);

                    if (cceeExists)
                        throw new Error('Os documentos desta referência já foram baixados.');
                }
            }

            if (referenceScraping <= currentReference)
            {
                console.log("Iniciar scraping da referencia: ", referenceScraping);
                const response:IScrapingResponse = await this.scrape.start(agent[0], config.ServiceConfigurations.EmailSettings, referenceScraping);
                console.log("Concluído o scraping da referencia: ", referenceScraping);

                //Enviar os documentos para DataCenter Crystal
                
                if (!response.HasError)
                {
                    if (response.Documents !== null){
                        if (response.Documents.length > 0)
                        {                            
                            //const responsePostCCEE: IPostCCEEDataResponse = await this.dataCenterApi.PostCCEEData(robotId, referenceScraping, agent[0].CNPJ, agent[0].Nome, response, config);                                                        

                            const responsePostCCEE: IPostCCEEDataResponse = {
                                isSucesso: true,
                                isAlerta: false, 
                                isError: false, 
                                message: "Incluído com sucesso"
                            };

                            if (responsePostCCEE.isSucesso) {
                                //sucesso
                                messageRef="100";
                                await this.dataCenterApi.PostMonitorData(1,
                                                                   messageRef,
                                                                   robotId,                                                                   
                                                                   `Agent: ${agentId}: ${agentNome}, Referência: ${referenceScraping}, Empresa: ${agentEmpresa}`, 
                                                                   responsePostCCEE.message,
                                                                   "",
                                                                   "host",
                                                                   "hostConfig",
                                                                   "UserAgent",
                                                                   config.ServiceConfigurations.Versao,
                                                                   config);
                                
                                serviceResponse = { message: responsePostCCEE.message, 
                                                    notificationType: 1, 
                                                    notificationMessage:"✅ " + responsePostCCEE.message, 
                                                    hasError: false 
                                                  };
                            }
                            else if (responsePostCCEE.isAlerta) {
                                messageRef="200";
                                await this.dataCenterApi.PostMonitorData(2,
                                    messageRef,
                                    robotId,
                                    `Agent: ${agentId}: ${agentNome}, Referência: ${referenceScraping}, Empresa: ${agentEmpresa}`, 
                                    responsePostCCEE.message,
                                    "",
                                    "host",
                                    "hostConfig",
                                    "UserAgent",
                                    config.ServiceConfigurations.Versao,
                                    config);
                                
                                
                                serviceResponse = { message: responsePostCCEE.message, 
                                                    notificationType: 2, 
                                                    notificationMessage:"⚠ " + responsePostCCEE.message, 
                                                    hasError: false 
                                                  };
                            }
                            else {
                                messageRef="300";
                                await this.dataCenterApi.PostMonitorData(3,
                                    messageRef,
                                    robotId,
                                    `Agent: ${agentId}: ${agentNome}, Referência: ${referenceScraping}, Empresa: ${agentEmpresa}`, 
                                    responsePostCCEE.message,
                                    "",
                                    "host",
                                    "hostConfig",
                                    "UserAgent",
                                    config.ServiceConfigurations.Versao,
                                    config);
                                
                                serviceResponse = { message: responsePostCCEE.message, 
                                                    notificationType: 4, 
                                                    notificationMessage:"❌ " + responsePostCCEE.message, 
                                                    hasError: true 
                                                  };
                            }
                        }
                        else {
                            messageRef="201";
                            this.dataCenterApi.PostMonitorData(2,
                                messageRef,
                                robotId,
                                `Agent: ${agentId}: ${agentNome}, Referência: ${referenceScraping}, Empresa: ${agentEmpresa}`, 
                                response.Message,
                                "",
                                "host",
                                "hostConfig",
                                "UserAgent",
                                config.ServiceConfigurations.Versao,
                                config);

                            serviceResponse = { message: response.Message, 
                                                notificationType: 2, 
                                                notificationMessage:"⚠ " + response.Message, 
                                                hasError: false 
                                              };
                        }
                    }
                    else {
                        messageRef="202";
                        await this.dataCenterApi.PostMonitorData(2,
                            messageRef,
                            robotId,
                            `Agent: ${agentId}: ${agentNome}, Referência: ${referenceScraping}, Empresa: ${agentEmpresa}`, 
                            response.Message,
                            "",
                            "host",
                            "hostConfig",
                            "UserAgent",
                            config.ServiceConfigurations.Versao,
                            config);

                        serviceResponse = { message: response.Message, 
                                            notificationType: 2, 
                                            notificationMessage:"⚠ " + response.Message, 
                                            hasError: false 
                                          };
                    }
                }
                else 
                    throw new Error("❌ " + response.Message);
            }
            else
                throw new Error("❌ Referência informada é maior que a atual.");
        } catch (err){
            
            this.dataCenterApi.PostMonitorData(3,
                "301",
                robotId,
                `Agent: ${agentId}: ${agentNome}, Referência: ${referenceScraping}, Empresa: ${agentEmpresa}`, 
                err,
                "",
                "host",
                "hostConfig",
                "UserAgent",
                versao,
                config);

            serviceResponse = { message: err, 
                                notificationType: 4, 
                                notificationMessage:"❌ " + err, 
                                hasError: true
                              };            
        }

        return serviceResponse;
    }
}