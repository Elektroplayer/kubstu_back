declare global {
    namespace NodeJS {
        interface ProcessEnv {
            MONGO_URI: string;
            TOKEN: string;
        }
    }

    interface Date {
        getWeek(): number;
    }

    interface Lesson {
        number: number,
        time: string,
        name: string,
        paraType: string,
        teacher?: string,
        auditory?: string,
        remark?: string,
        percent?: string,
        flow?: boolean
    }

    interface Day {
        daynum: number,
        even: boolean,
        daySchedule: Lesson[]
    }
    
    interface Schedule {
        updateDate: Date,
        days: Day[]
    }

    interface IEvent {
        name: string,
        date?: Date,
        startDate?: Date,
        endDate?: Date,
        note: string,
        _id: string,
    }

    interface IEventWithoutId {
        name: string,
        note: string,
        date?: Date,
        startDate?: Date,
        endDate?: Date,
    }

    interface IResult {
        ok: boolean,
        message?: string,
    }
}

export {};