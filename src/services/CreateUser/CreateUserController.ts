import { Request, Response } from "express";
import { CreateUserService } from "./CreateUserService";

export class CreaterUserController {
    constructor(
        private createUserService: CreateUserService
    ){}
    async handle(request: Request, response: Response): Promise<Response>
    {
        const { name, email, password } = request.body;

        try {
            await this.createUserService.execute({
                name,
                email,
                password
            });

            return response.status(201).send();
        }
        catch (err) {
            return response.status(400).json({
                message: err.message || "unexpected error"
            })
        }
    }
}