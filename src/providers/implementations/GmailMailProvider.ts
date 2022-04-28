import Imap from 'imap';
import { promisify } from 'util';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';

import { IEmailSettings } from '../../configs/IScraperConfig';
import { IMailProvider } from "../IMailProvider";


export class GmailMailProvider implements IMailProvider {   

    constructor(){        
    }    

    async getTokenInEmail(settings:IEmailSettings): Promise<string[]>
    {
        dotenv.config();

        const imapConfig = {
            user: settings.Account,
            password: process.env.MAIL_PASSWORDD,
            host: settings.Server,
            port: settings.Port,
            tls: settings.UseSSL,
            tlsOptions: { 
              rejectUnauthorized: false, 
            }
          };        

        const imap = new Imap(imapConfig);
        const openBox = promisify(imap.openBox.bind(imap));


        function getEmails2() {
          return new Promise<string[]>(function(resolve, reject) {
            const result: string[] = []; 
                let counter = 0; 
        
                try {
                    imap.once('ready', () => {            
                        openBox('INBOX', false)
                          .then(inbox => {
                              const criteriaSearch = ['ALL', ['SINCE', new Date()], ['FROM', 'token@ccee.org.br']];
                              //const criteriaSearch = ['ALL', ['FROM', 'giogama@hotmail.com']]; 
                      
                              const search = promisify(imap.search.bind(imap));
                      
                              search(criteriaSearch).then(messages => {

                                function getToken(text: string): string {
                                    try {
                                        const tokenPattern = /\d{6}/g;
                                  
                                        const valor = text.match(tokenPattern);
                                  
                                        if (valor != null && valor != undefined) {
                                          return valor[0];
                                        }
                                  
                                        return "";
                                      }
                                      catch (err) {
                                      }
                                }    
                                  
                                  const last3Messages = messages.slice(-3);                                              
        
                                  //console.log(last3Messages);
                      
                                  if (last3Messages.length > 0)
                                  {
                                    const f = imap.fetch(last3Messages, {bodies: ''});
                                    f.on('message', (msg: Imap.ImapMessage) => {
                                        msg.on('body', (stream) => {
                                          counter++;  
                                          simpleParser(stream, (err, parsed) => {
                                            const {from, subject, textAsHtml, text} = parsed;                            
                                            
                                            let token = getToken(text.toString());                              
                                            
                                            if (token != "") {               
                                                  result.push(token);
                                            }     
                                            
                                            if (counter === last3Messages.length) {                                  
                                                resolve(result);                
                                            }   
                                          });
                                        });
                                        msg.once('attributes', (attrs) => {
                                          const {uid} = attrs;
                                          const attr = '\\Deleted';
                        
                                          imap.addFlags(uid, [attr], () => {
                                            // Mark the email as read after reading it                              
                                          });
                                        });
                                      });
                                      f.once('error', (err: Error) => {
                                        reject(err);
                                      });
                                      f.once('end', () => {                                                    
                                        imap.end();                               
                                      });
                                  }
                                  else {
                                    resolve(result);
                                    imap.end();                               
                                  }                          
                              })
                              .catch((err: Error) => {
                                  reject(err);
                                  imap.end();
                              })
                          })
                          .catch((err: Error) => {
                            reject(err);
                            imap.end();
                          })
                      });
                      
                    imap.connect();   
                }
                catch (err){
                    reject(err);
                }

          });
        }

        // var getEmails = new Promise(    
    
        //     function(resolve, reject) {
        //         const result: string[] = []; 
        //         let counter = 0; 
        
        //         try {
        //             imap.once('ready', () => {            
        //                 openBox('INBOX', false)
        //                   .then(inbox => {
        //                       const criteriaSearch = ['ALL', ['SINCE', new Date()], ['FROM', 'token@ccee.org.br']];
        //                       //const criteriaSearch = ['ALL', ['FROM', 'giogama@hotmail.com']]; 
                      
        //                       const search = promisify(imap.search.bind(imap));
                      
        //                       search(criteriaSearch).then(messages => {

        //                         function getToken(text: string): string {
        //                             try {
        //                                 const tokenPattern = /\d{6}/g;
                                  
        //                                 const valor = text.match(tokenPattern);
                                  
        //                                 if (valor != null && valor != undefined) {
        //                                   return valor[0];
        //                                 }
                                  
        //                                 return "";
        //                               }
        //                               catch (err) {
        //                               }
        //                         }    
                                  
        //                           const last3Messages = messages.slice(-3);                                              
        
        //                           //console.log(last3Messages);
                      
        //                           if (last3Messages.length > 0)
        //                           {
        //                             const f = imap.fetch(last3Messages, {bodies: ''});
        //                             f.on('message', (msg: Imap.ImapMessage) => {
        //                                 msg.on('body', (stream) => {
        //                                   counter++;  
        //                                   simpleParser(stream, (err, parsed) => {
        //                                     const {from, subject, textAsHtml, text} = parsed;                            
                                            
        //                                     let token = getToken(text.toString());                              
        //                                     console.log(token);
                                            
        //                                     if (token != "") {               
        //                                           result.push(token);
        //                                     }     
                                            
        //                                     if (counter === last3Messages.length) {                                  
        //                                         console.log("resolve");
        //                                         resolve(result);                
        //                                     }   
        //                                   });
        //                                 });
        //                                 msg.once('attributes', (attrs) => {
        //                                   const {uid} = attrs;
        //                                   const attr = '\\Deleted';
                        
        //                                   imap.addFlags(uid, [attr], () => {
        //                                     // Mark the email as read after reading it                              
        //                                   });
        //                                 });
        //                               });
        //                               f.once('error', (err: Error) => {
        //                                 reject(err);
        //                               });
        //                               f.once('end', () => {                                                    
        //                                 imap.end();                               
        //                               });
        //                           }
        //                           else {
        //                             resolve(result);
        //                             imap.end();                               
        //                           }                          
        //                       })
        //                       .catch((err: Error) => {
        //                           reject(err);
        //                           imap.end();
        //                       })
        //                   })
        //                   .catch((err: Error) => {
        //                     reject(err);
        //                     imap.end();
        //                   })
        //               });
                      
        //             imap.connect();   
        //         }
        //         catch (err){
        //             reject(err);
        //         }           
        //     }

            
        // );

        let retorno:string[]=[];

        // getEmails.then(function(result:string[]) {
        //     retorno = result;
        //     return result;
        // });        

        retorno = await getEmails2();

        return retorno;
    }    
}