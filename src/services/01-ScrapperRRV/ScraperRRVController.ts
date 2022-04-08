import { Request, Response } from "express";
import { ScraperRRVService } from "./ScraperRRVService";

export class ScraperRRVController {
    constructor(
        private scraperService: ScraperRRVService
    ){}

    async handle(request: Request, response: Response): Promise<Response>
    {
        try {
            const robotId = Number(request.params.roboid);
            const cnpj = request.params.cnpj;            

            await this.scraperService.execute(robotId, cnpj);

            return response.status(200).send();
        }
        catch (err) {
            return response.status(400).json({
                message: err.message || "unexpected error"
            })
        }
    }
}