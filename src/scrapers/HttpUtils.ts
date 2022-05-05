import axios from 'axios';
import puppeteer from 'puppeteer';
import fs from 'fs';

export interface IDownload {
    ContentFile: string;
    Description: string;
    Filename: string;
    Extension: string;
    MimeType: string;
}

var extToMimes = {
    '.img': 'image/jpeg',
    '.png': 'image/png', 
    '.zip': 'application/x-zip-compressed',
    '.xls': 'application/vnd.ms-excel',
    '.xlm': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xml': 'text/xml',
    '.txt': 'text/plain',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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
            const extension:string = "." + filename.split('.').pop();            
            fs.writeFileSync(filename, response.data);

            const fileBase64:string = Buffer.from(response.data, 'binary').toString('base64');

            return {ContentFile: fileBase64, Description: description, Filename: filename, Extension: extension, MimeType: extToMimes.hasOwnProperty(extension) ? extToMimes[extension] : "" };
      });
  }

