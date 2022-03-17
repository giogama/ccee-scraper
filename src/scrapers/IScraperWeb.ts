export interface IAgent {
    company: string;
    cnpj: string;
    url: string;
    login: string;
    password: string;
}

export interface IScraperWeb {
    scraper(agent: IAgent, ref: number): Promise<void>;
}