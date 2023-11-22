import { Injectable } from '@nestjs/common';
import { filePath } from 'utils/fileUtils';
import { decode } from 'jsonwebtoken';
import * as fs from 'fs';

@Injectable()
export class AmoCrmService {
  // Метод проверки не истёк ли access_token
  async isTokenExpire() {
    const { AMOCRM_ACCESS_TOKEN: token } = JSON.parse(
      fs.readFileSync(filePath, 'utf8'),
    );
    const { exp } = decode(token);
    const timeNow = Math.floor(Date.now() / 1000);

    return timeNow > exp;
  }
  // Метод для получения токенов либо по коду авторизации либо через refresh_token
  async getNewTokens(type) {
    const info = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const res = await fetch(
      `https://${process.env.AMOCRM_SUBDOMAIN}.amocrm.ru/oauth2/access_token`,
      {
        method: 'POST',
        body: JSON.stringify({
          client_id: process.env.AMOCRM_CLIENT_ID,
          client_secret: process.env.AMOCRM_CLIENT_SECRET,
          grant_type:
            type === 'authorization_code'
              ? 'authorization_code'
              : 'refresh_token',
          ...(type === 'authorization_code'
            ? { code: info['AMOCRM_AUTH_CODE'] }
            : { refresh_token: info['AMOCRM_REFRESH_TOKEN'] }),
          redirect_uri: process.env.AMOCRM_REDIRECT_URL,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const data = await res.json();

    info['AMOCRM_ACCESS_TOKEN'] = data.access_token;
    info['AMOCRM_REFRESH_TOKEN'] = data.refresh_token;
    // Запись токенов в json
    fs.writeFileSync(filePath, JSON.stringify(info, null, 2));
  }
  // Метод для создания сделки
  async makeDeal(query) {
    const { name, email, phone } = query;
    const { AMOCRM_ACCESS_TOKEN: token } = JSON.parse(
      fs.readFileSync(filePath, 'utf8'),
    );

    let userId;
    // Поиск контакта по email и номеру телефона
    for await (const filter of [email, phone]) {
      const res = await fetch(
        `https://${process.env.AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/contacts?query=${filter}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.status === 200) {
        const data = await res.json();
        userId = data?._embedded?.contacts[0].id;
        break;
      }
    }
    // Если контакт найден обновляем его данные
    if (userId) {
      await fetch(
        `https://${process.env.AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/contacts/${userId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            id: userId,
            name,
            custom_fields_values: [
              {
                field_id: 1473185,
                values: [
                  {
                    value: phone,
                  },
                ],
              },
              {
                field_id: 1473187,
                values: [
                  {
                    value: email,
                  },
                ],
              },
            ],
          }),
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } // Иначе создаём новый контакт
    else {
      const res = await fetch(
        `https://${process.env.AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/contacts`,
        {
          method: 'POST',
          body: JSON.stringify([
            {
              name,
              custom_fields_values: [
                {
                  field_id: 1473185,
                  values: [
                    {
                      value: phone,
                    },
                  ],
                },
                {
                  field_id: 1473187,
                  values: [
                    {
                      value: email,
                    },
                  ],
                },
              ],
            },
          ]),
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const data = await res.json();
      userId = data._embedded.contacts[0].id;
    }
    // Создание сделки с заданным контактом
    const res = await fetch(
      `https://${process.env.AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/leads`,
      {
        method: 'POST',
        body: JSON.stringify([
          {
            name: `Сделка с клиентом ${userId}`,
            price: 150000,
            _embedded: {
              contacts: [{ id: userId }],
            },
          },
        ]),
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return {
      status: res.status,
      msg: res.status === 200 ? 'Сделка создана' : ' ',
    };
  }
}
