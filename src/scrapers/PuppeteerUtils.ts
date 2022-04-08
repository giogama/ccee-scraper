import puppeteer from 'puppeteer';
import { IAgent, IEmailSettings } from '../configs/IScraperConfig';
import { IMailProvider } from '../providers/IMailProvider';

export async function startBrowser(){
	let browser: puppeteer.Browser;

	try {
	    console.log("Opening the browser......");
	    browser = await puppeteer.launch({
	        headless: false,
	        args: ["--disable-setuid-sandbox"],
	        'ignoreHTTPSErrors': true
	    });
	} catch (err) {
	    console.log("Could not create a browser instance => : ", err);
	}
	return browser;
}

export async function loginCCEE(agent:IAgent, page: puppeteer.Page){
	try {
		await page.waitForTimeout(5000);
		await page.type('#mat-input-0', agent.Login);
		await page.type('#mat-input-1', agent.Senha);

		const submit:puppeteer.ElementHandle[] = await page.$x("//button[starts-with(@class,'mat-flat-button w-100 clr-white mat-button mat-accent')]");
		await submit[0].click();
	} catch (err) {
	    console.log("Could not login on CCEE => : ", err);
	}
	return page;
}

export async function processToken(agent:IAgent,  page: puppeteer.Page, settings: IEmailSettings, mailProvider: IMailProvider){
	try {
		if (agent.HasToken)
		{
			await page.waitForTimeout(10000);
			
			//Apagar e-mails
			//TODO

			//Enviar token por e-mail
			const buttonEmail:puppeteer.ElementHandle[] = await page.$x("//input[starts-with(@value,'E-mail')]");
			await buttonEmail[0].click();

			//Aguardar o Token chegar no e-mail
			await page.waitForTimeout(12000);

			//Buscar o token no e-mail
			const token: string[] = await mailProvider.getTokenInEmail(settings);

			//Preencher Token
			if (token.length > 0)
			await page.type('#campoColetaUsuario', token[0]);

			//Enviar token
			await page.click("#enviar");
		}

		await page.type('#mat-input-0', agent.Login);
		await page.type('#mat-input-1', agent.Senha);

		const submit:puppeteer.ElementHandle[] = await page.$x("//button[starts-with(@class,'mat-flat-button w-100 clr-white mat-button mat-accent')]");
		await submit[0].click();
	} catch (err) {
	    console.log("Could not login on CCEE => : ", err);
	}
	return page;
}