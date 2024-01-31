
export function padToTwoDigits(num: number) {
    return num.toString().padStart(2, '0')
}

export function toHoursAndMinutes(totalMinutes: number) {
    return `${padToTwoDigits(Math.floor(totalMinutes / 60))}:${padToTwoDigits(totalMinutes % 60)}`
}

export const lessonLabel = (input: string) => {
    const inputProcessed = input?.toString().trim().toLowerCase()
    switch (inputProcessed) {
        case 'lecture':
        case 'лекція':
            return { label: 'Лекція', code: 'lecture' }
        case 'practical':
        case 'практичне':
            return { label: 'Практичне', code: 'practical' }
        case 'laboratory':
        case 'lab':
        case 'лабораторна':
            return { label: 'Лабораторна', code: 'lab' }
        default:
            return { label: input, code: input }
    }
}

export function getWeekNumber(d: Date) {
    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() != 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return [target.getFullYear(), 1 + Math.ceil((firstThursday.valueOf() - target.valueOf()) / 604800000)];
}

export const getDateFromWeek = (dayIndex: number, w: number, y: number) => {
    console.log(dayIndex, w, y)
    return new Date(
        getMonday(
            new Date(
                new Date('Jan 01, ' + y + ' 01:00:00').getTime() + (w - 1) * 7 * 24 * 60 * 60 * 1000,
            ),
        ).getTime() + (dayIndex * 24 * 60 * 60 * 1000)
    )
}

export const getMonday = (d: Date) => {
    const dt = new Date(d);
    const day = dt.getDay()
    const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(dt.setDate(diff));
}
export const datesAreOnSameDay = (first: Date, second: Date) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

export function pad(num: number, size: number) {
    let str = num.toString();
    while (str.length < size) str = "0" + str;
    return str;
}
export const placeType = {
    'Онлайн': 'online',
    'Онлайн (Zoom)': 'online_zoom',
    'Онлайн (Meet)': 'online_meet',
    'Онлайн (Other)': 'online_other',
    'Офлайн': 'offline',
    'Офлайн (Classroom)': 'offline_classroom',
    "Аудиторія": 'auditory'
}
export const isUndefined = (value: any) => typeof value === 'undefined'