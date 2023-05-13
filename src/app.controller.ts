import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/hello')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/check_data')
  checkData(@Query() query): ICheckedData {
    // query.group query.inst_id query.token?

    if (!query.group)
      return {
        ok: false,
        message: 'Не указана группа',
      };

    if (!query.inst_id)
      return {
        ok: false,
        message: 'Не указан институт',
      };

    // if (query.group == '22-КБ-ИВ1')
    //   return {
    //     ok: false,
    //     message: 'Эта группа в бане',
    //   };

    return {
      ok: true,
    };
  }
}
