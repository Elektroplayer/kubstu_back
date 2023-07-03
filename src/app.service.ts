import { Injectable } from '@nestjs/common';
import GroupsModel from './models/GroupsModel.js';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async testToken(token: string): Promise<{ ok: boolean; message?: string }> {
    const group = await GroupsModel.find({ token }).exec();

    if (group.length == 0) return { ok: false, message: 'Неверный токен' };
    if (group.length != 1) return { ok: false, message: 'Ошибка! Код: DUBLICAT' };

    return { ok: true };
  }
}
