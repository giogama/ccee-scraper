import { Router } from "express";
import { createUserController } from "./services/CreateUser";
import { scraperRRVController } from './services/01-ScrapperRRV';

const router = Router();

router.get('/nfe/:roboid/cnpj/:cnpj', (req, res) => {
    
    return scraperRRVController.handle(req, res);
});

router.post('/user', (req, res) => {
    return createUserController.handle(req, res);
});

export { router };