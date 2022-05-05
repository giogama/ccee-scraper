import { Request, Response } from "express";
import { IServiceResponse, ScraperRRVService } from "./ScraperRRVService";

export class ScraperRRVController {
    constructor(
        private scraperService: ScraperRRVService
    ){}

    async handle(request: Request, response: Response): Promise<Response>
    {
        try {
            const robotId = Number(request.params.roboid);
            const cnpj = request.params.cnpj;            

            const serviceResponse:IServiceResponse = await this.scraperService.execute(robotId, cnpj, 202202);           

            return response.status(200).json(serviceResponse);
        }
        catch (err) {
            return response.status(400).json({
                message: err || "unexpected error",
                notificationType: 4,
                notificationMessage: "❌ " + err,
                hasError:true
            });
        }
    }
}