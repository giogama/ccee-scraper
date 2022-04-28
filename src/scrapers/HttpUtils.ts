import axios from 'axios';
import puppeteer from 'puppeteer';
import fs from 'fs';


export async function downloadFile(url:string, cookies:puppeteer.Protocol.Network.GetAllCookiesResponse):Promise<string> {  
    const arrayCookies:puppeteer.Protocol.Network.Cookie[] = cookies["cookies"];
    let cookieLine: string = "";

    if (arrayCookies) {
        arrayCookies.forEach( async (item) => {
            const cookieName: string = item.name;
            const cookieValue: string = item.value;

            cookieLine += cookieName + "=" + cookieValue + "; ";  
        });
    }   

    return axios.request({
        responseType: 'arraybuffer',
        url,
        method: 'get',
        headers: {
           'Access-Control-Allow-Origin': '*', 
           'Content-Type': 'application/json',
           'Cookie': cookieLine,
         },
      }).then((response) => {
        const outputFilename = 'quadro1.xlsx';
        fs.writeFileSync(outputFilename, response.data);
        console.log("==================================");
        //console.log(response.headers['Content-Disposition']);
        //console.log(response.headers);
        const filename:string = response.headers['content-disposition'].split("filename=")[1];
        console.log(filename);

        const fileBase64:string = Buffer.from(response.data, 'binary').toString('base64');
        return fileBase64;
      });
  }

