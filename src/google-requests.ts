import { request as httpRequest } from 'https';

export class GoogleRequests {
  constructor() {}

  public getRequest(token: string, host: string, url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: host,
        port: 443,
        path: url,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      };

      let data = '';
      const req = httpRequest(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (d) => {
          data = `${data}${d}`;
        });
        res.on('end', () => {
          resolve(data);
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.end();
    });
  }

  public postRequest(token: string, host: string, url: string, post: any): Promise<any> {
    return new Promise((resolve, reject) => {

      const postData = JSON.stringify(post);

      const options = {
        hostname: host,
        port: 443,
        path: url,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }

      };

      let data = '';
      const req = httpRequest(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (d) => {
          data = `${data}${d}`;
        });
        res.on('end', () => {
          resolve(data);
        });
      });

      req.on('error', (e) => {
        reject(e);
      });
      req.write(postData);
      req.end();
    });
  }
}