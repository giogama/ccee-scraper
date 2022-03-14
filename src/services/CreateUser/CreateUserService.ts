import { User } from "../../entities/User";
import { IUserRepository } from "../../repositories/IUserRepository";
import { ICreateUserRequestDTO } from "./CreateUserDTO";

export class CreateUserService {
    constructor(private repUser: IUserRepository)
    {}

    async execute(data: ICreateUserRequestDTO) {
        const userAlreadyExists = await this.repUser.findByEmail(data.email);

        if (userAlreadyExists)
        {
            throw new Error("User already exists.");
        }

        const user = new User(data);
        await this.repUser.save(user);
    }
}