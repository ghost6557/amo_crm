import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  amoInit(@Query() query): void {
    this.appService.amoInit(query);
  }
}
