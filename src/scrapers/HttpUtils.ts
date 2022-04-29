import axios from 'axios';
import puppeteer from 'puppeteer';
import fs from 'fs';

export interface IDownload {
    ContentFile: string;
    Description: string;
    Filename: string;
    Extension: string;
}

export async function downloadFile(description:string, url:string, cookies:puppeteer.Protocol.Network.GetAllCookiesResponse):Promise<IDownload> {  
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
            const filename:string = response.headers['content-disposition'].split("filename=")[1].toString().replaceAll(`"`, '').replaceAll(`'`, '');
            const extension:string = filename.split('.').pop();            
            fs.writeFileSync(filename, response.data);

            const fileBase64:string = Buffer.from(response.data, 'binary').toString('base64');

            return {ContentFile: fileBase64, Description: description, Filename: filename, Extension: extension};
      });
  }

