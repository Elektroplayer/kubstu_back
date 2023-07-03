import { Body, Controller, Delete, Get, Post, Put, Query } from '@nestjs/common';
import { AppService } from './app.service.js';
import Cache from './lib/Cache.js';
import { Types } from 'mongoose';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/auth')
  async auth(@Query('token') token: string): Promise<IResult> {
    return await this.appService.testToken(token);
  }

  @Get('/timetable')
  async getTimetable(@Query('token') token: string): Promise<IResult | Schedule> {
    let tokenTest = await this.appService.testToken(token);

    if(!tokenTest.ok) return tokenTest;

    let name = token.split(":")[0];
    let instId = token.split(":")[1];

    let group = await Cache.getGroup(name, instId);

    return await group.getRawFullSchedule();
  }

  @Put('/timetable')
  async updateTimetable(@Query('token') token: string): Promise<IResult | { ok: boolean, message?: string, schedule?: Schedule; }> {
    let tokenTest = await this.appService.testToken(token);

    if(!tokenTest.ok) return tokenTest;
    
    let name = token.split(":")[0];
    let instId = token.split(":")[1];

    let group = await Cache.getGroup(name, instId);

    return await group.updateScheduleFromSite();
  }

  @Get('/events')
  async getEvents(@Query('token') token: string): Promise<IResult | IEvent[]> {
    let tokenTest = await this.appService.testToken(token);

    if(!tokenTest.ok) return tokenTest;
    
    let name = token.split(":")[0];
    let instId = token.split(":")[1];

    let group = await Cache.getGroup(name, instId);

    return await group.getAllRawEvents();
  }

  @Post('/events')
  async createEvent(@Body() body: IEventWithoutId, @Query('token') token: string): Promise<IResult | { ok: boolean, id?: Types.ObjectId }> {
    let tokenTest = await this.appService.testToken(token);

    if(!tokenTest.ok) return tokenTest;

    if(!body.name || body.name.length == 0 || body.name.length > 100) return {
      ok: false,
      message: "Заголовок должен существовать и его длина не может превышать 100 символов"
    }

    if(body.note && body.note.length > 500) return {
      ok: false,
      message: "Длина описания события не может превышать 500 символов"
    }
    
    let name = token.split(":")[0];
    let instId = token.split(":")[1];

    let group = await Cache.getGroup(name, instId);

    return await group.createEvent(body);
  }

  @Put('/events')
  async updateEvent(@Body() body: IEventWithoutId, @Query('id') id: string, @Query('token') token: string) {
    let tokenTest = await this.appService.testToken(token);

    if(!tokenTest.ok) return tokenTest;

    if(!body.name || body.name.length == 0 || body.name.length > 100) return {
      ok: false,
      message: "Заголовок должен существовать и его длина не может превышать 100 символов"
    }

    if(body.note && body.note.length > 500) return {
      ok: false,
      message: "Длина описания события не может превышать 500 символов"
    }
    
    let name = token.split(":")[0];
    let instId = token.split(":")[1];

    let group = await Cache.getGroup(name, instId);

    return await group.updateEvent(id, body);
  }

  @Delete('/events')
  async deleteEvent(@Query('id') id: string, @Query('token') token: string): Promise<IResult> 
  {
    let tokenTest = await this.appService.testToken(token);

    if(!tokenTest.ok) return tokenTest;
    
    let name = token.split(":")[0];
    let instId = token.split(":")[1];

    let group = await Cache.getGroup(name, instId);

    return await group.deleteEvent(id);
  }
}
