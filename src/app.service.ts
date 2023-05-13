import { Injectable } from '@nestjs/common';
import fetch from "node-fetch";
import https from "https";

interface ICheckedData {
  ok: boolean;
  message?: string;
}

const insts = [495, 516, 490, 29, 528, 539, 540, 541];

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async groupsParser(inst_id: number | string, kurs: number | string) {
    let now = new Date();
    let date = (now.getUTCFullYear() - (now.getUTCMonth() >= 6 ? 0 : 1)).toString();

    let url = `https://elkaf.kubstu.ru/timetable/default/time-table-student-ofo?iskiosk=0&fak_id=${inst_id}&kurs=${kurs}&ugod=${date}`;

    let res = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
      },
      agent: new https.Agent({ rejectUnauthorized: false })
    });

    let text = await res.text();

    let matches = text.match(/<option.+<\/option>/g);

    if(!matches) return;

    let groups = matches.slice( matches.indexOf("<option value=\"\">Выберите группу</option>")+1, matches.length )
    .map(elm => {
      let r = elm.substring(elm.indexOf(">")+1, elm.length);
      r = r.substring(0, r.indexOf("<"));
      return r;
    });

    return groups;
  }

  async testData(inst_id: number, group: string): Promise<ICheckedData> {
    if (!insts.includes(inst_id)) return { ok: false, message: 'Такого института не существует' };

    let year = +(group[0] + group[1]);

    if (!year) return { ok: false, message: 'Такого института не существует' };

    let now = new Date();
    let kurs = now.getUTCFullYear() - 2000 - (now.getUTCMonth() >= 6 ? 0 : 1) - year + 1;

    let groups = await this.groupsParser(inst_id, kurs)

    if(!groups || !groups.includes(group)) return { ok: false, message: 'Такой группы не существует' };

    return {
      ok: true,
    };
  }
}
