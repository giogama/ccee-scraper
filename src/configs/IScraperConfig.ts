export interface IAgent {
    Id: number;
    Empresa: string;
    CNPJ: string;
    Nome: string;
    Tipo: string;    
    Url: string;
    Login: string;
    Senha: string;
    ParamNome1: string;
    ParamValor1: string;
    ParamNome2: string;
    ParamValor2: string;
    ParamNome3: string;
    ParamValor3: string;
    ParamNome4: string;
    ParamValor4: string;
    ParamNome5: string;
    ParamValor5: string;
    DownloadPath: string;
    Sobreescrever: boolean;
    HasToken: boolean;
    Hash: string;
    UltimaReferencia: number;
}

export interface IEmailSettings {
    Server: string;
    Port: number;
    UseSSL: boolean;
    Account: string;
    CriptoPassword: string;
}

export interface IServiceConfigurations
{
    ServiceWebPort: number;
    UserCCEERobotApi: string;
    PasswordCCEERobotApi: string;
    Url: string;
    UserId: string;
    AccessKey: string;
    AppKey: string;
    Versao: string;
    HeadlessBrowser: boolean;
    NomeQueue: string;
    EmailSettings: IEmailSettings;
    UserAgent: string;
    NumberRepeatOnFailure: number;
    Agents: IAgent[];
}

export interface IScraperConfig {
    ServiceConfigurations: IServiceConfigurations;
}
