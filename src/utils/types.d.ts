export type lecturerShort = {
    code: string
    name: string
    surname: string
    patronymic: string
}
export enum PlaceType {
    "online" = "online",
    "online_zoom" = "online_zoom",
    "online_meet" = "online_meet",
    "online_other" = "online_other",
    "offline" = "offline",
    "offline_classroom" = "offline_classroom",
    "auditory" = "auditory"
}
export type Lesson = {
    code?: string,
    start_date: number[],
    end_date: number[],
    template?: string | null
    subgroup: 0 | 1 | 2
    lecturers?: string[] | null
    names?: Array<string>
    comment?: string
    time: number
    duration?: number
    places?: { text: string, place_type: PlaceType }[] | null
    canceled?: boolean
    lesson_type?: string
    recordings?: Array<string>,
    day_number: 1,
    week_number: 1,
}
export const LessonBase: Lesson = {
    day_number: 1,
    week_number: 1,
    template: undefined,
    lecturers: [],
    subgroup: 0,
    comment: "",
    names: ["Не заповнено"],
    time: 120,
    duration: 120,
    places: null,
    lesson_type: null,
    recordings: [],
    start_date: [2023, 9, 13],
    end_date: [2023, 12, 31],
    created_by: null
};
export type LessonChange = {
    code?: string,
    lesson_code?: string,
    start_date: number[],
    end_date: number[],
    template?: string | null,
    lecturers?: string[] | null,
    names?: Array<string> | null,
    comment?: string | null,
    time?: number,
    duration?: number,
    places?: { text: string, place_type: PlaceType }[] | null,
    canceled?: boolean,
    lesson_type?: string,
    recordings?: Array<string>,
    created_by?: CreatedBy
}
export type outputDayObject = {
    code: string
    used_template: string | undefined
    subgroup: 0 | 1 | 2
    lecturers: Array<lecturerShort>
    names: Array<string>
    comment: string
    time: number
    duration: number
    places: { text: string, place_type: PlaceType }[]
    canceled: boolean
    lesson_type: string
    recordings: Array<string>
}
export type LessonDataOpened = {
    id: string
    dayIndex: number
    week: number
    year: number
    group_code: string
    data: outputDayObject
}
export type LessonFormProps = {
    id?: string
    day?: number
    month?: number
    year?: number
    group_code?: string
}
export type LessonChangeFormProps = {
    lesson_code?: string
    code?: string
    day?: number
    month?: number
    year?: number
    group_code?: string
}

export type CreatedBy = {
    app_code?: string,
    user_code?: string
}

export type LessonTemplate = {
    id: string,
    subgroup?: number,
    lecturers?: string[],
    names: string[],
    time?: number,
    duration?: number,
    places?: { text: string, place_type: PlaceType }[],
    lesson_type?: string,
    canceled?: string,
    created_by?: CreatedBy
}

export enum TMemberPermissions {
    addOnetimeChange = 'write:lessons',
    addLessons = 'write:lessons',
    removeLessons = 'delete:lessons',
    deleteLessons = 'write:lessons',
    readTemplates = 'read:templates',
    writeTemplates = 'write:templates',
};
export type TGroup = {
    code: string,
    names: string[],
    desc: string,
    faculty: string,
    speciality: string,
    has_second_subgroup: boolean,
    is_member: boolean,
    permissions: TMemberPermissions[]
}