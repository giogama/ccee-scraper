import axios from 'axios';
import { IScraperConfig } from '../../configs/IScraperConfig';
import { IScrapingResponse } from '../../scrapers/CCEEUtils';
import { removeEnterAndLineFeedCharacters } from '../../services/Helpers/CommonHelper';
import { IDataCenterProvider, IPostCCEEDataResponse } from "../IDataCenterProvider";

export class DataCenterProvider implements IDataCenterProvider {   

    constructor(){        
    }    

    async getLastReference(idRobot:number, cnpj:string, appKey:string, userId:string, accessKey:string, url:string): Promise<number>
    {        
        const urlService = url + `/api/v1/CCEE/${cnpj}/tipo/${idRobot}/ultimos/1/semanexo`;
        
        try{
            const tokenAuth = await this.autenticate(appKey, userId, accessKey, url);

            return axios.request({            
                url: urlService,
                method: 'get',
                headers: {                
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + tokenAuth
                }
            }).then((response) => {  
                if (response.status === 200){
                    if (!response.data.hasError) {
                        if (response.data.model.length > 0 )
                            return response.data.model[0].referencia;
                        else
                            return 0;
                    }
                    else
                        throw new Error(response.data.errorMessage);    
                } else if (response.status === 401){
                    throw new Error("Não autorizado acessar o serviço Crystal API.");
                }
                else
                {
                    throw new Error(`Erro ao comunicar com a Crystal API. Retornou o Http Status: ${response.status}`);
                }
            });

        } catch(err)  {
            throw err;
        }        
    }

    async isCCEEExists(idRobot:number, cnpj:string, reference:number, config: IScraperConfig): Promise<boolean>
    {
        const urlService = config.ServiceConfigurations.Url + `/api/v1/CCEE/${cnpj}/tipo/${idRobot}/ref/${reference}`;

        try { 
            const tokenAuth = await this.autenticate(config.ServiceConfigurations.AppKey, 
                                                     config.ServiceConfigurations.UserId, 
                                                     config.ServiceConfigurations.AccessKey, 
                                                     config.ServiceConfigurations.Url);

            return axios.request({            
                url: urlService,
                method: 'get',
                headers: {                
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + tokenAuth
                }
            }).then((response) => {                   
                console.log(response.data);

                if (response.status === 200){
                    if (!response.data.hasError) {
                        return response.data.returnCode === 1;                        
                    }
                    else
                        throw new Error(response.data.errorMessage);    
                } else if (response.status === 401){
                    throw new Error("Não autorizado acessar o serviço Crystal API.");
                }
                else
                {
                    throw new Error(`Erro ao comunicar com a Crystal API. Retornou o Http Status: ${response.status}`);
                }
            });
        }
        catch(err) {
            throw err;
        }
    }

    async PostCCEEData(robotId:number, reference:number, cnpj:string, description:string, model:IScrapingResponse, config: IScraperConfig): Promise<IPostCCEEDataResponse | null>
    {   
        interface IAnexoApi {
            descricao: string;
            nomeArquivo: string;
            conteudoArquivoBase64: string;
            contentType: string;
            extensaoArquivo: string;
        }     

        const urlService = config.ServiceConfigurations.Url + "/api/v1/CCEE/salvarlista";

        try{
            const tokenAuth = await this.autenticate(config.ServiceConfigurations.AppKey, 
                config.ServiceConfigurations.UserId, 
                config.ServiceConfigurations.AccessKey, 
                config.ServiceConfigurations.Url);

            let anexos: IAnexoApi[] = [];    

            model.Documents.forEach(doc => {
                const item:IAnexoApi = { 
                    descricao: doc.Description,
                    nomeArquivo: doc.Filename,
                    conteudoArquivoBase64: doc.ContentFile,
                    contentType: doc.MimeType,
                    extensaoArquivo: doc.Extension
                };

                anexos.push(item);
            });

            return axios.request({            
                url: urlService,
                method: 'post',
                headers: {                    
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + tokenAuth
                },
                data: [{
                    id: 0,
                    referencia: reference, 
                    descricao: description, 
                    cnpj, 
                    tipo: robotId,
                    anexos: anexos,
                    mensagemRetorno: null
                }]
            }).then((response) => {        
                    if (response.data.hasError && !response.data.hasException) {
                        return {isSucesso: false, isAlerta:true, isError:false, message:response.data.message.toString()};                    
                    } else if (response.data.hasException) {
                        return {isSucesso: false, isAlerta:false, isError:true, message:response.data.message.toString()};                    
                    }
                    else {
                        return {isSucesso:true, isAlerta:false, isError:false, message:response.data.message.toString()};
                    }
            }).catch((err) =>{
                console.log("(Post CCEE)axios error: ", err);
                return {isSucesso:false, isAlerta:false, isError:true, message: err};
            });

        } catch(err)  {
            throw err;
        }        
    }

    async PostMonitorData(tipo:number, idLocal:string, idRobo:number, parametros:string, resumo:string, detalhes:string, host:string, hostConfig:string, userAgent:string, versao:string, config: IScraperConfig): Promise<string>
    {   
        const urlService = config.ServiceConfigurations.Url + "/api/v1/monitorRobo";

        try{

            if (config !== null){
                resumo = resumo.toString().replaceAll("'","").replaceAll("\\","\\\\").replaceAll("{","").replaceAll("}","");
                detalhes = detalhes.toString().replaceAll("'","").replaceAll("\\","\\\\").replaceAll("{","").replaceAll("}","");

                resumo = removeEnterAndLineFeedCharacters(resumo);
                detalhes = removeEnterAndLineFeedCharacters(detalhes);

                const tokenAuth = await this.autenticate(config.ServiceConfigurations.AppKey, 
                    config.ServiceConfigurations.UserId, 
                    config.ServiceConfigurations.AccessKey, 
                    config.ServiceConfigurations.Url);
                
                console.log("(DataCenterProvider)Iniciar o PostMonitorData");
                console.log("Url: ", urlService);

                return axios.request({            
                    url: urlService,
                    method: 'post',
                    headers: {                    
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + tokenAuth
                    },
                    data: {
                        idRobo,
                        nomeRobo: "CCEERobo", 
                        parametros, 
                        idLocal, 
                        resumo, 
                        detalhes,
                        username: "1",
                        tipo,
                        host,
                        hostConfig,
                        userAgent,
                        versao
                    }
                }).then((response) => {        
                        console.log("Response PostMonitorData: ", response.data);

                        if (response.data.hasError || response.data.hasException) {
                            return response.data.message;
                        } else {
                            return ""; //sucesso
                        }
                }).catch((err) =>{
                    console.log("(Post Monitor) axios error: ", err);
                });
            }            

        } catch(err)  {
            throw err;
        }        
    }
    

    private async autenticate(appKey:string, userId:string, accessKey:string, url:string): Promise<string>
    {        
        const urlLogin = url + "/api/v1/login";

        try{
        return axios.request({            
            url: urlLogin,
            method: 'post',
            headers: {
               'Access-Control-Allow-Origin': '*', 
               'Content-Type': 'application/json'
             },
            data: {
                AppKey: appKey,
                UserId: userId, 
                AccessKey: accessKey
             }
          }).then((response) => {                                  
                if (response.data.hasError == false) {
                    if (response.data.model.authenticated)
                        return response.data.model.accessToken;
                    else
                    {
                        throw new Error("Falha na autenticação na Crystal API");        
                    }
                }

                throw new Error(response.data.errorMessage);
          });

        } catch(err)  {
            throw err;
        }        
    }
}