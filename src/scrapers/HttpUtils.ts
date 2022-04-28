import axios from 'axios';
import puppeteer from 'puppeteer';


export async function downloadFile(url:string, cookies:puppeteer.Protocol.Network.GetAllCookiesResponse):Promise<Blob> {  
    //const url = 'https://unsplash.com/photos/AaEQmoufHLk/download?force=true'
    //const path = Path.resolve(__dirname, 'images', 'code.jpg')
    //const writer = Fs.createWriteStream(path)

    const arrayCookies:puppeteer.Protocol.Network.Cookie[] = cookies["cookies"];
    let cookieLine: string = "";

    if (arrayCookies) {
        arrayCookies.forEach( async (item) => {
            const cookieName: string = item.name;
            const cookieValue: string = item.value;

            cookieLine += cookieName + "=" + cookieValue + "; ";  
        });
    }

    console.log("cookieLine: ", cookieLine);
  
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      withCredentials: true,
      headers: {
          'Access-Control-Allow-Origin': '*', 
          'Content-Type': 'application/json',
          'Cookie': cookieLine,
        }
    });

    //responseType: 'blob'
  
    //response.data.pipe(writer)
  
    return new Promise((resolve, reject) => {
        response.data.on("end", () => {
            resolve(new Blob[response.data]);
        });

        response.data.on("error", (err:Error) => {
            reject(err);
        });      
    })
  }

