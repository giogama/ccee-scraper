import { User } from "../../entities/User";
import { IMailProvider } from "../../providers/IMailProvider";
import { IUserRepository } from "../../repositories/IUserRepository";
import { ICreateUserRequestDTO } from "./CreateUserDTO";

export class CreateUserService {
    constructor(
        private repUser: IUserRepository,
        private mailProvider: IMailProvider
    ) {}

    async execute(data: ICreateUserRequestDTO) {
        const userAlreadyExists = await this.repUser.findByEmail(data.email);

        if (userAlreadyExists)
        {
            throw new Error("User already exists.");
        }

        const user = new User(data);
        await this.repUser.save(user);

        await this.mailProvider.sendMail(
            {
                from: {
                     name: 'Sistema XYZ',
                     email: 'naoresponsa@app.com.br',
                },
                to: {
                    name:  data.name,
                    email: data.email,
                },
                subject: 'Seja bem vindo ao App',
                body: 'Agora você faz parte a plataforma.',
            }
        );
    }
}