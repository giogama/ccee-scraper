import puppeteer from 'puppeteer';
import { IAgent } from '../configs/IScraperConfig';

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
		await page.type('#mat-input-0', agent.Login);
		await page.type('#mat-input-1', agent.Senha);

		const submit:puppeteer.ElementHandle[] = await page.$x("//button[starts-with(@class,'mat-flat-button w-100 clr-white mat-button mat-accent')]");
		await submit[0].click();
	} catch (err) {
	    console.log("Could not login on CCEE => : ", err);
	}
	return page;
}