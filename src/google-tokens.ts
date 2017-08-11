import { request as httpRequest } from 'https';
import { sign as jwt_sign } from 'jsonwebtoken';
import { stringify as querystring_stringify } from 'querystring';
import { readFileSync } from 'fs';
import { resolve as path_resolve, isAbsolute } from 'path';
import minimist = require('minimist');

export class IGoogleToken {
  promise?: Promise<string>;
  timeout: number;
  token: string;
  expires: number;
  email: string;
  pem: string;
  scope: string;
  refresh: number;
  timer?: any;
}

export class GoogleTokens {
  private _token_cache: IGoogleToken[] = [];

  constructor() {}

  public addToken(email: string, pem: string, scope: string, timeout = 3600, refresh = 3300) {
    this._token_cache.push({
      timeout: timeout,
      token: '',
      expires: 0,
      email: email,
      pem: pem,
      scope: scope,
      refresh: refresh
    });
  }

  public get token(): Promise<string> {
    return this.getToken(0);
  }

  public getToken(i = 0) {
    if (i >= this._token_cache.length) { return Promise.resolve(''); }
    return this.getTokenCache(this._token_cache[i]);
  }

  public getTokenCache(cache: IGoogleToken) {
    if (cache.token !== '' && cache.expires > ((Date.now() / 1000) + cache.refresh)) {
      // console.log('Reusing', this.expires, ((Date.now() / 1000) + cache.refresh));
      return Promise.resolve(cache.token);
    }

    // already fetching a token, returns existing promise
    if (cache.promise) { return cache.promise; }

    // re-fetch token
    return this.fetchToken(cache);
  }

  private setTimer(cache) {
    try { clearInterval(cache.timer); } catch (e) {}
    cache.timer = setInterval(this.fetchToken(cache), Math.floor(cache.refresh * 1000));
  }


  private fetchToken(cache: IGoogleToken): Promise<string> {

    // Set absolute path for pem key
    let pem = cache.pem;
    if (pem && !isAbsolute(pem)) { pem = path_resolve(__dirname, pem); }
    if (!cache.timeout) { cache.timeout = 3600; }
    if (!cache.refresh) { cache.refresh = Math.floor(cache.timeout - (cache.timeout * .2)); }

    cache.promise = new Promise((resolve, reject) => {
      let cert: Buffer;
      try { cert = readFileSync(pem); } catch (e) {} // get private key
      const token_exp = Math.floor(Date.now() / 1000) + cache.timeout;
      const token = jwt_sign({
        iss: cache.email,
        scope: cache.scope,
        aud: 'https://www.googleapis.com/oauth2/v4/token',
        exp: token_exp,
        iat: Math.floor(Date.now() / 1000)
      },
      cert,
      { algorithm: 'RS256'});

      const postData = querystring_stringify({
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': token
      });

      const options = {
        hostname: 'www.googleapis.com',
        port: 443,
        path: '/oauth2/v4/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
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
          const resp = JSON.parse(data);
          if (resp.error) {
            reject(`${resp.error}\n${resp.error_description}`);
          } else {
            cache.token = resp.access_token;
            cache.expires = token_exp;
            this.setTimer(cache);
            resolve(resp.access_token);
          }
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.write(postData);
      req.end();
    });

    return cache.promise;
  }
}
