/* eslint-disable prettier/prettier */
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { Request } from 'express';
dotenv.config();

@Injectable()
export class AppService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async proxyReqest(req: Request) {
    console.log('original Url', req.originalUrl);
    console.log('method', req.method);
    console.log('body', req.body);

    const recipient = req.originalUrl.split('/')[1];
    console.log('recipient', recipient);
    const recipientURL = process.env[recipient];
    console.log('recipientURL', recipientURL);

    if (recipientURL) {
      const url = req.originalUrl.slice(`/${recipient}`.length);
      console.log('url', url);

      if (req.originalUrl.includes('products') && req.method === 'GET') {
        const cacheKey = `products:${req.originalUrl}`;
        const cachedResponse = await this.cacheManager.get(cacheKey);
        if (cachedResponse) {
          console.log(
            'Product Response from cache',
            JSON.stringify(cachedResponse),
          );
          return cachedResponse;
        }
      } else console.log('No product cache');

      const axiosConfig = {
        headers: {
          authorization: req.headers.authorization,
        },
        method: req.method,
        url: `${recipientURL}${url}`,
        ...(Object.keys(req.body || {}).length > 0 && { data: req.body }),
      };

      console.log('axiosConfig', axiosConfig);

      try {
        const response = await axios(axiosConfig);
        console.log('response from recipient', response.data);
        if (req.originalUrl.includes('products') && req.method === 'GET') {
          const cacheKey = `products:${req.originalUrl}`;
          this.cacheManager.set(cacheKey, response.data, 120);
          console.log('Product cache was set');
        }
        return response.data;
      } catch (err) {
        console.log('error', JSON.stringify(err));
        if (err.response) {
          const { status, data } = err.response;

          throw { status, data };
        } else {
          throw { status: 500, data: { error: err.message } };
        }
      }

      // axios(axiosConfig)
      //   .then(function (response) {
      //     console.log('response from recipient', response.data);
      //     if (req.originalUrl.includes('products') && req.method === 'GET') {
      //       const cacheKey = `products:${req.originalUrl}`;
      //       this.cacheManager.set(cacheKey, response.data, { ttl: 120 });
      //       console.log('Product cache was set');
      //     }
      //     return response.data;
      //   })
      //   .catch((err) => {
      //     console.log('error', JSON.stringify(err));
      //     if (err.response) {
      //       const { status, data } = err.response;

      //       throw { status, data };
      //     } else {
      //       throw { status: 500, data: { error: err.message } };
      //     }
      //   });
    } else {
      throw { status: 502, data: { error: 'Cannot process request' } };
    }
  }
}
