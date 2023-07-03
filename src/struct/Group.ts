import Parser from "./Parser.js";
import Schedules from "../models/GroupsModel.js";
import EventModel from "../models/EventsModel.js";
import { Types } from "mongoose";

export default class Group {
  kurs: number;
  parser: Parser;
  schedule?: Schedule;
  token?: string;

  constructor(public name: string, public instId: number) {
    let year = +(name[0] + name[1]);
    let now = new Date();

    this.kurs = now.getUTCFullYear() - 2000 - (now.getUTCMonth() >= 6 ? 0 : 1) - year + 1; // FIXME: Будет работать до 2100 года

    this.parser = new Parser(instId, this.kurs, name);
  }

  /**
   * Инициализировать группу
   */
  async init() {
    await this.initToken();
  }

  async getRawFullSchedule() {
    if (!this.schedule || new Date().valueOf() - this.schedule.updateDate?.valueOf() > 1000 * 60 * 60 * 24) {
      let r = await this.updateSchedule();
      if (r == null) return null;
    }

    return this.schedule
  }

  /**
   * Получить все события в JSON формате
   */
  async getAllRawEvents() {
    // date.setUTCHours(0, 0, 0, 0);

    let filter = {
      // $or: [
      //   {
      //     date: date
      //   }, {
      //     startDate: { $lte: date }, endDate: { $gte: date }
      //   }
      // ],
      $and: [
        {
          $or: [{ groups: undefined }, { groups: this.name }]
        }, {
          $or: [{ kurses: undefined }, { kurses: this.kurs }]
        }, {
          $or: [{ inst_ids: undefined }, { inst_ids: this.instId }]
        }
      ]
    }

    let dayEvents:IEvent[] = (await EventModel.find(filter)).map((elm) => {
      return {
        name: elm.name,
        date: elm.date,
        startDate: elm.startDate,
        endDate: elm.endDate,
        note: elm.note,
        _id: elm._id.toString(),
      }
    });

    return dayEvents;
  }

  /**
   * Создаём новое событие
   */
  async createEvent(info: IEventWithoutId): Promise<{ ok: boolean, id?: Types.ObjectId }> {
    let event = new EventModel({ ...info, groups: [this.name] });
    let savedEvent = await event.save().catch(console.log);

    if(typeof savedEvent == 'object') return {
      ok: true,
      id: savedEvent._id 
    };
    else return {
      ok: false
    }
  }

  /**
   * Обновление события
   */
  async updateEvent(id, info:IEventWithoutId) {
    try {
      let event = await EventModel.findOne({ _id: id }).exec()

      if(event == null || !event.groups.includes(this.name)) return {
        ok: false,
        message: 'Событие с таким id не найдено или недоступно для изменения.'
      }

      event.name       = info.name;
      event.note       = info.note;
      event.date       = info.date;
      event.startDate  = info.startDate;
      event.endDate    = info.endDate;

      event.save().catch(console.log)

      return {
        ok: true
      }
    } catch (err) {
      if(err.toString() == 'CastError: Cast to ObjectId failed for value \"'+ id +'\" (type string) at path \"_id\" for model \"events\"')
        return {
          ok: false,
          message: 'Событие с таким id не найдено или недоступно для изменения.'
        }
      else return {
        ok: false,
        message: 'Произошла неизвестная ошибка\n' + err.toString()
      }
    }
  }

  /**
   * Удаление событий
   */
  async deleteEvent(id): Promise<IResult> {
    try {
      let event = await EventModel.findOne({ _id: id }).exec()

      if(event == null || !event.groups.includes(this.name)) return {
        ok: false,
        message: 'Событие с таким id не найдено или недоступно для удаления.'
      }

      await event.deleteOne().catch(console.log)

      return {
        ok: true
      }
    } catch (err) {
      if(err.toString() == 'CastError: Cast to ObjectId failed for value \"'+ id +'\" (type string) at path \"_id\" for model \"events\"')
        return {
          ok: false,
          message: 'Событие с таким id не найдено или недоступно для удаления.'
        }
      else return {
        ok: false,
        message: 'Произошла неизвестная ошибка\n' + err.toString()
      }
    }
  }

  /**
  * Устанавливает новое расписание
  */
  setSchedule(days: Day[], updateDate = new Date()) {
    this.schedule = { updateDate, days };

    return this.schedule;
  }

  /**
  * Ищет расписание.
  * Если оно есть в БД и оно не устарело, устанавливает его.
  * Если оно есть в БД, но оно устарело, парсит информацию с сайта и обновляет расписание в БД (при этом если сайт не работает, даёт что есть ничего не обновляя).
  * Если записи в БД нет, парсит расписание и создаёт запись в БД.
  * Если сайт не работает и в БД записей нет, выдаёт null.
  */
  async updateSchedule() {
    let dbResponse = await Schedules.findOne({ group: this.name }).exec()

    if (dbResponse) {
      if (new Date().valueOf() - dbResponse.timetable.updateDate?.valueOf() < 1000 * 60 * 60 * 24)
        return this.setSchedule(dbResponse.timetable.days as Day[], dbResponse.timetable.updateDate)
      else {
        try {
          let days = await this.parser.parseSchedule();

          dbResponse.timetable.days = days;
          dbResponse.timetable.updateDate = new Date();

          dbResponse.save().catch(console.log);

          return this.setSchedule(days);
        } catch (error) {
          console.log(error)
          return this.setSchedule(dbResponse.timetable.days as Day[], dbResponse.timetable.updateDate)
        }
      }
    } else {
      return null
    }
  }

  /**
   * Обновить расписание с сайта
   */
  async updateScheduleFromSite(): Promise<{ok: boolean, message?: string, schedule?: Schedule}> {
    try {
      let days = await this.parser.parseSchedule()

      let dbResponse = await Schedules.findOne({ group: this.name }).exec()

      if (dbResponse) {
        dbResponse.timetable.days = days;
        dbResponse.timetable.updateDate = new Date();

        dbResponse.save().catch(console.log)
      } else {
        return {
          ok: false,
          message: "Что-то пошло не так..."
        }
      }

      return {
        ok: true,
        schedule: this.setSchedule(days)
      };
    } catch (error) {
      return {
        ok: false,
        message: "Похоже, что сайт ВУЗа не работает..."
      }
    }
  }

  /**
   * Нужно, чтобы в класс записался токен
   */
  async initToken() {
    this.token = (await Schedules.findOne({ group: this.name }).exec())?.token;
  }
}
