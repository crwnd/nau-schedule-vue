import { ref } from 'vue'
import { defineStore } from 'pinia'
// import { useWebApp } from 'vue-tg'
import { type Lesson, type LessonChange, type LessonTemplate, type lecturerShort, type outputDayObject } from '@/utils/types.d.js'
import debounce from 'lodash/debounce'
import { getDateFromWeek, getWeekNumber } from '@/utils/functions.js'
import { useAuth0 } from "@auth0/auth0-vue"
import { useGroupsStore } from './groups'

// const tgUser = useWebApp()

export const useScheduleStore = defineStore('schedule', () => {
  const auth0 = useAuth0()
  const dataStore = ref<Array<{ isLoading: boolean, group_code: string, year: number, week: number, weekNumber: number, days: outputDayObject[][] }>>([])
  const templates = ref<{ templates: LessonTemplate[], isLoading: boolean, speciality: string }[]>([])
  const lessonChanges = ref<Array<LessonChange & { isLoading: boolean }>>([])

  const isLecturersLoading = ref(false)
  const lecturers = ref<lecturerShort[]>([])

  function normalize(arr: any[]): outputDayObject[] {
    return arr.map((el) =>
    ({
      code: el.code,
      subgroup: el.subgroup || 0,
      used_template: el.template || el.used_template || undefined,
      comment: el.comment || '',
      lecturers: el.lecturers,
      names: el.names,
      time: el.time,
      duration: el.duration,
      places: el.places,
      canceled: el.canceled,
      lesson_type: el.lesson_type,
      recordings: el.recordings
    })
    )
  }

  const loadWeek = async (week: number, year: number, group_code: string, refresh = false) => {
    const endpoint = 'weekScheduleByWeek'//auth0.isAuthenticated.value ? 'weekScheduleByWeekAuth0' : 'weekScheduleByWeekPublic'
    const authHeader: HeadersInit = auth0.isAuthenticated.value ? { 'Authorization': `Bearer ${await auth0.getAccessTokenSilently()}` } : {}

    if (isNaN(week) || isNaN(year)) {
      return
    }
    if (!refresh && dataStore.value.some((el) => el.group_code === group_code && el.week === week && el.year === year)) {
      return
    }
    if (!refresh)
      dataStore.value.push({ isLoading: true, group_code, week, year, weekNumber: -1, days: [] });

    try {
      const resp = await (
        await fetch(`${import.meta.env.VITE_API_URL}/purple/schedule/${endpoint}?${new URLSearchParams({ group_code, week: week.toString(), year: year.toString() }).toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader
          }
        })
      ).json()

      if (resp.error) {
        throw new Error(resp.error)
      }

      dataStore.value[dataStore.value.findIndex((el) => el.group_code === group_code && el.week === week && el.year === year)] = {
        isLoading: false, group_code, week, year, weekNumber: resp.week_number, days: resp.days.map((el: { lessons: outputDayObject[] }) => normalize(el.lessons))
      }
    } catch (e) {
      console.log('fetch /weekSchedule failed', e)
    }
  }

  function getSchedule(group_code: string, week: number, year: number) {
    if (dataStore.value.some((el) => el.group_code === group_code && el.week === week && el.year === year)) {
      return dataStore.value.find((el) => el.group_code === group_code && el.week === week && el.year === year);
    }
    loadWeek(week, year, group_code);
    return dataStore.value[dataStore.value.length - 1];
  }

  function isToday(week: number, year: number, index: number) {
    const currentdate = new Date()
    const nowWeek = getWeekNumber(currentdate)[1]
    const nowDayIndex = currentdate.getDay() === 0 ? 6 : currentdate.getDay() - 1
    return week === nowWeek && year === currentdate.getFullYear() && index === nowDayIndex
  }

  function getByHoursSchedule(group_code: string, week: number, year: number, preloadPrevNext: boolean) {
    const thisWeek = new Date(new Date(
      new Date('Jan 01, ' + year + ' 01:00:00').getTime() +
      604800000 * (week - 1),
    ).getTime() + 1000 * 60 * 60 * 24)

    const schedule = getSchedule(group_code, week, year)
    if (schedule?.isLoading === false) {
      const newDays = schedule.days.map((dayLessons, dayIndex) => {
        dayLessons.sort((el1, el2) => el1.time - el2.time)
        const newArr = dayLessons.reduce((groups: { [key: number]: outputDayObject[] }, item: outputDayObject) => {
          const group = (groups[item.time] || []);
          group.push(item);
          groups[item.time] = group;
          return groups;
        }, {})
        if (preloadPrevNext) {
          getSchedule(group_code, getWeekNumber(new Date(thisWeek.valueOf() - 7 * 24 * 60 * 60 * 1000))[1], getWeekNumber(new Date(thisWeek.valueOf() - 7 * 24 * 60 * 60 * 1000))[0])
          getSchedule(group_code, getWeekNumber(new Date(thisWeek.valueOf() + 7 * 24 * 60 * 60 * 1000))[1], getWeekNumber(new Date(thisWeek.valueOf() + 7 * 24 * 60 * 60 * 1000))[0])
        }
        return { lessons: newArr, isToday: isToday(week, year, dayIndex) }
      })
      return { ...schedule, days: newDays }
    }
    return {
      isLoading: true,
      group_code: group_code,
      year,
      week,
      weekNumber: -1,
      days: [{ lessons: {}, isToday: false }]
    }
  }

  async function makeUpdate(updateObject: Record<string, any>, lessonId: string, dayIndex: number, week: number, year: number, group_code: string) {
    const date = getDateFromWeek(dayIndex, week, year)
    const arr = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    await fetch(`${import.meta.env.VITE_API_URL}/purple/changes/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await auth0.getAccessTokenSilently()}`
      },
      body: JSON.stringify({ ...updateObject, lesson_code: lessonId, group_code, start_date: arr, end_date: arr })
    })
  }
  const updateCommentDebounce = debounce(async (newComment: string, lessonId: string, dayIndex: number, week: number, year: number, group_code: string) => {
    await makeUpdate({ comment: newComment }, lessonId, dayIndex, week, year, group_code)
  }, 500)
  const commentInputHandler = async (newComment: string, lessonId: string, dayIndex: number, week: number, year: number, group_code: string) => {
    const nodeIndex = dataStore.value.findIndex((el) => el.group_code === group_code && el.week === week)
    if (nodeIndex !== -1) {
      const lessonIndex = dataStore.value[nodeIndex].days[dayIndex].findIndex(el => el.code === lessonId)
      if (lessonIndex !== -1) {
        dataStore.value[nodeIndex].days[dayIndex][lessonIndex].comment = newComment
      }
    }
    updateCommentDebounce(newComment, lessonId, dayIndex, week, year, group_code)
  }

  async function insertLesson(lesson: Lesson, group_code: string) {
    if (!auth0.isAuthenticated.value) {
      return
    }
    const lessonResp = (await (await fetch(`${import.meta.env.VITE_API_URL}/purple/lessons/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await auth0.getAccessTokenSilently()}`
      },
      body: JSON.stringify({ ...lesson, group_code })
    })).json())
    const startDate = new Date(lessonResp.start_date[0], lessonResp.start_date[1] - 1, lessonResp.start_date[2])
    const endDate = new Date(lessonResp.end_date[0], lessonResp.end_date[1] - 1, lessonResp.end_date[2])
    await Promise.all(
      dataStore.value.filter((el) => el.group_code === group_code && getDateFromWeek(6, el.week, el.year).valueOf() >= startDate.valueOf() - (24 * 60 * 60 * 1000) && getDateFromWeek(0, el.week, el.year).valueOf() <= endDate.valueOf() + (24 * 60 * 60 * 1000))
        .map((el) => loadWeek(el.week, el.year, el.group_code, true))
    )
  }

  async function updateLesson(lesson: Lesson, group_code: string) {
    if (!auth0.isAuthenticated.value) {
      return
    }
    const lessonResp = (await (await fetch(`${import.meta.env.VITE_API_URL}/purple/lessons/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await auth0.getAccessTokenSilently()}`
      },
      body: JSON.stringify({ ...lesson, group_code })
    })).json())
    const startDate = new Date(lessonResp.start_date[0], lessonResp.start_date[1] - 1, lessonResp.start_date[2])
    const endDate = new Date(lessonResp.end_date[0], lessonResp.end_date[1] - 1, lessonResp.end_date[2])
    await Promise.all(
      dataStore.value.filter((el) => el.group_code === group_code && getDateFromWeek(6, el.week, el.year).valueOf() >= startDate.valueOf() - (24 * 60 * 60 * 1000) && getDateFromWeek(0, el.week, el.year).valueOf() <= endDate.valueOf() + (24 * 60 * 60 * 1000))
        .map((el) => loadWeek(el.week, el.year, el.group_code, true))
    )
  }

  async function deleteLesson(code: string, group_code: string) {
    if (!auth0.isAuthenticated.value) {
      return
    }
    const lessonResp = (await (await fetch(`${import.meta.env.VITE_API_URL}/purple/lessons/destroy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await auth0.getAccessTokenSilently()}`
      },
      body: JSON.stringify({ code, group_code })
    })).json())
    const startDate = new Date(lessonResp.start_date[0], lessonResp.start_date[1] - 1, lessonResp.start_date[2])
    const endDate = new Date(lessonResp.end_date[0], lessonResp.end_date[1] - 1, lessonResp.end_date[2])
    await Promise.all(
      dataStore.value.filter((el) => el.group_code === group_code && getDateFromWeek(6, el.week, el.year).valueOf() >= startDate.valueOf() - (24 * 60 * 60 * 1000) && getDateFromWeek(0, el.week, el.year).valueOf() <= endDate.valueOf() + (24 * 60 * 60 * 1000))
        .map((el) => loadWeek(el.week, el.year, el.group_code, true))
    )
  }

  const loadTemplates = async (speciality: string) => {
    if (!auth0.isAuthenticated.value || templates.value.some((el) => el.speciality === speciality)) {
      return
    }
    templates.value.push({ isLoading: true, speciality: speciality, templates: [] });

    try {
      const resp = await (
        await fetch(`${import.meta.env.VITE_API_URL}/purple/templates/index?${new URLSearchParams({ speciality })}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await auth0.getAccessTokenSilently()}`
          }
        })
      ).json()

      templates.value[templates.value.findIndex((el) => el.speciality === speciality)] = {
        isLoading: false, speciality: speciality, templates: resp as LessonTemplate[]
      }
    } catch (e) {
      console.warn('fetch /weekSchedule failed', e)
    }
  }
  const getSpecialityTemplates = (group_code: string) => {
    const groupsStore = useGroupsStore()
    const group = groupsStore.groups.find((el) => el.code === group_code)
    if (!group) {
      return [] as LessonTemplate[];
    }
    if (templates.value.some((el) => el.speciality === group.speciality)) {
      return templates.value.find((el) => el.speciality === group.speciality)?.templates ?? [] as LessonTemplate[];
    }
    loadTemplates(group.speciality);
    return templates.value[templates.value.length - 1]?.templates ?? [] as LessonTemplate[];
  }

  const loadLecturers = async () => {
    if (lecturers.value?.length || isLecturersLoading.value) {
      return
    }

    isLecturersLoading.value = true

    try {
      const resp = await (
        await fetch(`${import.meta.env.VITE_API_URL}/lecturers/index`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      ).json()

      lecturers.value = resp as lecturerShort[]
    } catch (e) {
      console.warn('fetch /lecturers/index failed', e)
    }

    isLecturersLoading.value = false
  }

  const getLessonChanges = async (lesson_code: string, group_code: string) => {
    if (!auth0.isAuthenticated.value || lessonChanges.value.some((el) => el.lesson_code === lesson_code)) {
      return
    }
    lessonChanges.value.push({
      isLoading: true,
      lesson_code,
      start_date: [],
      end_date: []
    });

    try {
      const resp = await (
        await fetch(`${import.meta.env.VITE_API_URL}/purple/changes/getMany?${new URLSearchParams({ lesson_code, group_code })}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await auth0.getAccessTokenSilently()}`
          }
        })
      ).json()

      lessonChanges.value = lessonChanges.value.filter((el) => el.lesson_code !== lesson_code)
      lessonChanges.value.push(...resp.map((el: LessonChange) => ({ ...el, isLoading: false })))
    } catch (e) {
      console.warn('fetch /purple/changes/getMany failed', e)
    }
  }
  const insertLessonChange = async (lessonChange: Partial<LessonChange>, group_code: string) => {
    if (!auth0.isAuthenticated.value) {
      return
    }
    const resp = await (await fetch(`${import.meta.env.VITE_API_URL}/purple/changes/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await auth0.getAccessTokenSilently()}`
      },
      body: JSON.stringify({ ...lessonChange, group_code })
    })).json()
    lessonChanges.value.push({ ...resp, isLoading: false })
    if (!lessonChange.start_date || !lessonChange.end_date) {
      return console.warn('insertLessonChange: start_date or end_date is not defined')
    }
    const startDate = new Date(lessonChange.start_date[0], lessonChange.start_date[1] - 1, lessonChange.start_date[2])
    const endDate = new Date(lessonChange.end_date[0], lessonChange.end_date[1] - 1, lessonChange.end_date[2])
    await Promise.all(
      dataStore.value.filter((el) => el.group_code === group_code && getDateFromWeek(6, el.week, el.year).valueOf() >= startDate.valueOf() - (24 * 60 * 60 * 1000) && getDateFromWeek(0, el.week, el.year).valueOf() <= endDate.valueOf() + (24 * 60 * 60 * 1000))
        .map((el) => loadWeek(el.week, el.year, el.group_code, true))
    )
  }
  const updateLessonChange = async (lessonChange: Partial<LessonChange>, group_code: string) => {
    if (!auth0.isAuthenticated.value) {
      return
    }
    const resp = await (await fetch(`${import.meta.env.VITE_API_URL}/purple/changes/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await auth0.getAccessTokenSilently()}`
      },
      body: JSON.stringify({ ...lessonChange, group_code })
    })).json()
    lessonChanges.value = lessonChanges.value.filter((el) => el.code !== lessonChange.code)
    lessonChanges.value.push({ ...resp, isLoading: false })
    if (!lessonChange.start_date || !lessonChange.end_date) {
      return console.warn('updateLessonChange: start_date or end_date is not defined')
    }
    const startDate = new Date(lessonChange.start_date[0], lessonChange.start_date[1] - 1, lessonChange.start_date[2])
    const endDate = new Date(lessonChange.end_date[0], lessonChange.end_date[1] - 1, lessonChange.end_date[2])
    await Promise.all(
      dataStore.value.filter((el) => el.group_code === group_code && getDateFromWeek(6, el.week, el.year).valueOf() >= startDate.valueOf() - (24 * 60 * 60 * 1000) && getDateFromWeek(0, el.week, el.year).valueOf() <= endDate.valueOf() + (24 * 60 * 60 * 1000))
        .map((el) => loadWeek(el.week, el.year, el.group_code, true))
    )
  }

  const getLesson = async (group_code: string, code: string) => {
    if (!auth0.isAuthenticated.value) {
      return
    }

    try {
      return (await (
        await fetch(`${import.meta.env.VITE_API_URL}/purple/lessons/getSingle?${new URLSearchParams({ group_code, code })}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await auth0.getAccessTokenSilently()}`
          }
        })
      ).json())

    } catch (e) {
      console.warn('fetch /purple/lessons/getSingle failed', e)
    }
    return null
  }

  const getLessonChange = async (group_code: string, change_code: string) => {
    if (!auth0.isAuthenticated.value) {
      return
    }

    try {
      return (await (
        await fetch(`${import.meta.env.VITE_API_URL}/purple/changes/getSingle?${new URLSearchParams({ group_code, change_code })}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await auth0.getAccessTokenSilently()}`
          }
        })
      ).json())

    } catch (e) {
      console.warn('fetch /purple/changes/getSingle failed', e)
    }
    return null
  }

  return {
    dataStore, templates, lessonChanges, lecturers,
    getSchedule, getByHoursSchedule, getWeekNumber,
    commentInputHandler, makeUpdate, getSpecialityTemplates, getLesson, insertLesson, updateLesson, deleteLesson,
    getLessonChange, getLessonChanges, insertLessonChange, updateLessonChange,
    loadLecturers
  }
})
