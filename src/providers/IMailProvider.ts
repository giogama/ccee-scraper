interface IAddress {
    name: string;
    email: string;
}

export interface IMessage {
    from: IAddress;
    to: IAddress;
    subject: string;
    body: string;
}

export interface IMailProvider {
    sendMail(message: IMessage): Promise<void>;
}