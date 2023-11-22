import { Injectable } from '@nestjs/common';
import { AmoCrmService } from './amo-crm/amo-crm.service';
import { filePath } from 'utils/fileUtils';
import * as fs from 'fs';

@Injectable()
export class AppService {
  constructor(private amoCrmService: AmoCrmService) {}
  // Метод инициализирующий интеграцию с amo-crm
  async amoInit(query) {
    const data = JSON.stringify(
      {
        AMOCRM_AUTH_CODE: query.code,
      },
      null,
      2,
    );
    //Запись кода авторизации в json
    fs.writeFileSync(filePath, data);
    //Получение токенов по коду авторизации
    await this.amoCrmService.getNewTokens('authorization_code');
  }
}
