import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { NoAuthRequired } from './auth/no-auth-required.decorator.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @NoAuthRequired()
  getHello(): string {
    return this.appService.getHello();
  }
}
