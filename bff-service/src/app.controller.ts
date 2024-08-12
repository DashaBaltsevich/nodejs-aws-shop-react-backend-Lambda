import { All, Controller, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Request, Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @All('/*')
  async handleRequest(@Req() req: Request, @Res() res: Response) {
    await this.appService
      .proxyReqest(req)
      .then((data) => {
        return res.json(data);
      })
      .catch((err) => {
        if (err.status) {
          res.status(err.status).json(err.data);
        } else {
          console.log('error', err.message);
          res.status(500).json({ error: 'Cannot process request' });
        }
      });
  }
}
