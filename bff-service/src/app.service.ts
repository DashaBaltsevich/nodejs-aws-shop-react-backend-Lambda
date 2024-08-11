/* eslint-disable prettier/prettier */
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
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

    if (!recipientURL) {
      throw { status: 502, data: { error: 'Cannot process custom request' } };
    }

    const url = req.originalUrl.slice(`/${recipient}`.length);
    console.log('url', url);

    const isProductRequest =
      req.originalUrl.includes('product') && req.method === 'GET';

    if (isProductRequest) {
      const cacheKey = `${req.method}:${req.originalUrl}`;
      console.log('cacheKey', cacheKey);
      const cachedResponse = (await this.cacheManager.get(
        cacheKey,
      )) as AxiosResponse;
      console.log('cachedResponse', cachedResponse);
      if (cachedResponse) {
        console.log('Product Response from cache', cachedResponse);
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
      console.log('response from recipient', response);
      if (isProductRequest) {
        const cacheKey = `${req.method}:${req.originalUrl}`;
        console.log('cacheKey', cacheKey);
        await this.cacheManager.set(cacheKey, response.data, 120);
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
  }
}
