import { Controller, Get, Query } from '@nestjs/common';
import { AmoCrmService } from './amo-crm.service';
import { AmoCrmDto } from './dto/amo-crm.dto';

@Controller('amo-crm')
export class AmoCrmController {
  constructor(private readonly amoCrmService: AmoCrmService) {}

  // Метод для создания сделки
  @Get()
  async makeDeal(@Query() query: AmoCrmDto) {
    //Если access_token истёк получаем новую пару токенов
    if (await this.amoCrmService.isTokenExpire()) {
      await this.amoCrmService.getNewTokens('refresh_token');
    }
    return await this.amoCrmService.makeDeal(query);
  }
}
