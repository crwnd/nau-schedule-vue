<script setup lang="ts">
import { computed, ref, nextTick, onMounted } from 'vue'
import Header from '@/components/Header.vue'
import IconGoogleMeet from '@/components/icons/IconGoogleMeet.vue'
import IconMapPin from '@/components/icons/IconMapPin.vue'
import { useRouter, useRoute } from 'vue-router'
import { useScheduleStore } from '@/stores/schedule'
import { useGroupsStore } from '@/stores/groups'
import { useUserStore } from '@/stores/user'
import type {
  Lesson,
  LessonChange,
  LessonChangeFormProps,
  LessonDataOpened,
  LessonFormProps,
} from '@/utils/types.d.js'
import {
  toHoursAndMinutes,
  lessonLabel,
  getWeekNumber,
  padToTwoDigits,
  getMonday,
  datesAreOnSameDay,
} from '@/utils/functions.js'
// import { useWebApp } from 'vue-tg'
import { PlaceType, TMemberPermissions } from '@/utils/types.d.js'
// const tgUser = useWebApp()

const userStore = useUserStore()

const groupsStore = useGroupsStore()

const lessonDataOpened = ref<LessonDataOpened>()
const lessonFormOpened = ref<LessonFormProps>()
const lessonChangeFormOpened = ref<LessonChangeFormProps>()

const scheduleStore = useScheduleStore()
const route = useRoute()
const router = useRouter()
const dayNames = [
  'Понеділок',
  'Вівторок',
  'Середа',
  'Четвер',
  "П'ятниця",
  'Субота',
  'Неділя',
]
const dayNamesShort = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД']
const monthName = [
  'Січень',
  'Лютий',
  'Березень',
  'Квітень',
  'Травень',
  'Червень',
  'Липень',
  'Серпень',
  'Вересень',
  'Жовтень',
  'Листопад',
  'Грудень',
]

const dayRefs = ref<Element[]>([])

const dateFromRoute = computed(() => {
  const dateObj = {
    year: parseInt((route.params.year || '').toString()),
    month: parseInt((route.params.month || '').toString()) - 1,
    day: parseInt((route.params.day || '').toString()),
  }
  const date = new Date(
    parseInt((route.params.year || '').toString()),
    parseInt((route.params.month || '').toString()) - 1,
    parseInt((route.params.day || '').toString()),
  )

  return { date, week: getWeekNumber(date)[1], ...dateObj }
})
const pageObj = computed(() => {
  const resp = scheduleStore.getByHoursSchedule(
    route.params.group_code.toString(),
    dateFromRoute.value.week,
    dateFromRoute.value.year,
    true,
  )
  // const activeDayIndex = resp?.days.findIndex((el) => el.isToday)
  // if (activeDayIndex !== -1 && activeDayIndex !== undefined) {
  //   highlightThisDay(activeDayIndex)
  // } else {
  highlightThisDay(toMondayBased(dateFromRoute.value.date.getDay()))
  // }
  return resp
})
const bar = computed(() => {
  let days: Array<{
    day: number
    month: number
    year: number
    date: Date
    isToday: boolean
    isRequested: boolean
  }> = []
  let weeks: Array<{
    week: number
    year: number
    weekNumber: number
    days: typeof days
  }> = []

  const firstDayOfMonth = new Date(
    dateFromRoute.value.year,
    dateFromRoute.value.month,
    1,
  )
  let preDays: typeof days = []
  for (let i = 1; i <= toMondayBased(firstDayOfMonth.getDay()); i++) {
    const thisDay = new Date(
      firstDayOfMonth.valueOf() - i * 24 * 60 * 60 * 1000,
    )
    preDays.push({
      day: thisDay.getDate(),
      month: thisDay.getMonth(),
      year: thisDay.getFullYear(),
      date: thisDay,
      isToday: datesAreOnSameDay(thisDay, new Date()),
      isRequested: datesAreOnSameDay(thisDay, dateFromRoute.value.date),
    })
  }
  days = preDays.reverse()

  const daysAmount = numDays(
    dateFromRoute.value.year,
    dateFromRoute.value.month + 1,
  )
  for (let i = 0; i < daysAmount - 1; i++) {
    const thisDay = new Date(
      firstDayOfMonth.valueOf() + i * 24 * 60 * 60 * 1000,
    )
    days.push({
      day: thisDay.getDate(),
      month: thisDay.getMonth(),
      year: thisDay.getFullYear(),
      date: thisDay,
      isToday: datesAreOnSameDay(thisDay, new Date()),
      isRequested: datesAreOnSameDay(thisDay, dateFromRoute.value.date),
    })
  }

  const lastDayOfMonth = new Date(
    dateFromRoute.value.year,
    dateFromRoute.value.month,
    daysAmount - 1,
  )
  for (let i = 1; i <= 7 - toMondayBased(lastDayOfMonth.getDay()) - 1; i++) {
    const thisDay = new Date(lastDayOfMonth.valueOf() + i * 24 * 60 * 60 * 1000)
    days.push({
      day: thisDay.getDate(),
      month: thisDay.getMonth(),
      year: thisDay.getFullYear(),
      date: thisDay,
      isToday: datesAreOnSameDay(thisDay, new Date()),
      isRequested: datesAreOnSameDay(thisDay, dateFromRoute.value.date),
    })
  }

  const chunkSize = 7
  for (let i = 0; i < days.length; i += chunkSize) {
    const daysThisWeek = days.slice(i, i + chunkSize)
    const weekInfo = getWeekNumber(daysThisWeek[0].date)
    weeks.push({
      week: weekInfo[1],
      year: weekInfo[0],
      weekNumber:
        scheduleStore.dataStore.find(
          (el) => el.week === weekInfo[1] && el.year === weekInfo[0],
        )?.weekNumber || -1,
      days: daysThisWeek,
    })
  }

  return weeks
})

async function highlightThisDay(activeDayIndex: number) {
  await nextTick()
  dayRefs.value[activeDayIndex]?.scrollIntoView({
    behavior: 'auto',
    block: 'nearest',
    inline: 'center',
  })
}

const daysOfThisWeek = computed(() => {
  let arr: Array<{
    date: Date
    day: number
    month: number
    year: number
    label: string
    labelWithYear: string
  }> = []
  const firstDay = new Date(
    getMonday(
      new Date(
        new Date('Jan 01, ' + pageObj.value?.year + ' 01:00:00').getTime() +
          (pageObj.value?.week! - 1) * 7 * 24 * 60 * 60 * 1000,
      ),
    ).getTime(),
  )
  for (let i = 0; i < 7; i++) {
    const thisDay = new Date(firstDay.getTime() + 1000 * 60 * 60 * 24 * i)
    arr.push({
      date: thisDay,
      day: thisDay.getDate(),
      month: thisDay.getMonth() + 1,
      year: thisDay.getFullYear(),
      label: `${padToTwoDigits(thisDay.getDate())}.${padToTwoDigits(
        thisDay.getMonth() + 1,
      )}`,
      labelWithYear: `${padToTwoDigits(thisDay.getDate())}.${padToTwoDigits(
        thisDay.getMonth() + 1,
      )}.${thisDay.getFullYear()}`,
    })
  }
  return arr
})

const numDays = (y: number, m: number) => new Date(y, m, 0).getDate()
const toMondayBased = (index: number) => (index === 0 ? 6 : index - 1)

const scrollContainer = ref()

const getPlaceEntry = (place: { text: string; place_type: PlaceType }) => {
  const placeObj = {
    label: '',
    link: null as string | null,
  }
  switch (place.place_type) {
    case PlaceType.auditory:
      placeObj.label = place.text
      break
    case PlaceType.online_meet:
      placeObj.label = 'Meet'
      placeObj.link = place.text
      break
    default:
      placeObj.label = place.text
      break
  }
  console.log(placeObj)
  return placeObj
}

onMounted(() => {
  scrollContainer.value.addEventListener('wheel', (evt: WheelEvent) => {
    evt.preventDefault()
    scrollContainer.value.scrollLeft += evt.deltaY
  })
})
</script>

<template>
  <div>
    <Header>
      <template #default>
        <div id="header-group-seldect">
          <select
            v-if="groupsStore.groups?.length"
            :value="route.params.group_code"
            @change="
              (e: Event) =>
                router.push({
                  params: {
                    group_code: (e.target as HTMLSelectElement)?.value,
                  },
                })
            "
          >
            <option
              v-for="group in groupsStore.groups"
              :key="group.code"
              :value="group.code"
            >
              {{ group.names[0] }}
            </option>
          </select>
        </div>
      </template>
    </Header>
    <main>
      <div id="main-content">
        <div id="schedule-page">
          <div id="week-schedule">
            <div id="week-schedule__topbar">
              <div class="month-selector">
                <h2>Місяць</h2>
                <select
                  :value="dateFromRoute.month + 1"
                  @input="
                    (e) =>
                      router.replace({
                        params: {
                          month: (e.target as HTMLSelectElement).value,
                          day: 1,
                        },
                      })
                  "
                >
                  <option
                    v-for="(month, index) in monthName"
                    :key="index"
                    :value="index + 1"
                  >
                    {{ month }}
                  </option>
                </select>
              </div>
              <div class="add-lesson">
                <button
                  v-if="
                    userStore.user?.permissions?.includes(
                      TMemberPermissions.readTemplates,
                    )
                  "
                  @click="
                    lessonFormOpened = {
                      group_code: route.params.group_code.toString(),
                      year: dateFromRoute.year,
                      month: dateFromRoute.month + 1,
                      day: dateFromRoute.day,
                    }
                  "
                  @close="lessonFormOpened = undefined"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-plus"
                  >
                    <path d="M12 5v14m7-7H5" />
                  </svg>
                  <span>Додати пару</span>
                </button>
              </div>
            </div>
            <!-- <div id="week-schedule__date-and-buttons">
              <button @click="router.push((parseInt(route.params.week.toString()) - 1).toString())">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="lucide lucide-chevron-left"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <p id="week-schedule__date-p">
                <span class="week-schedule__date-part start">{{
                  daysOfThisWeek[0].day + ' ' + monthNames[daysOfThisWeek[0].month - 1]
                }}</span>
                <span class="week-schedule__date-part mid">-</span>
                <span class="week-schedule__date-part end">{{
                  daysOfThisWeek[6].day + ' ' + monthNames[daysOfThisWeek[6].month - 1]
                }}</span>
              </p>
              <button @click="router.push((parseInt(route.params.week.toString()) + 1).toString())">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="lucide lucide-chevron-right"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div> -->
            <!-- <div id="week-schedule__week-number">
              <span v-if="pageObj?.weekNumber"
                >{{
                  pageObj?.weekNumber !== -1
                    ? pageObj?.weekNumber === 2
                      ? 'Другий'
                      : 'Перший'
                    : 'Невідомий'
                }}
                тиждень</span
              >
            </div> -->
            <div id="week-schedule__days" ref="scrollContainer">
              <div
                v-for="(week, weekIndex) of bar"
                :key="weekIndex"
                class="week-schedule__days__week"
              >
                <p v-if="pageObj?.weekNumber">
                  {{
                    week.weekNumber !== -1
                      ? week.weekNumber === 2
                        ? 'Другий'
                        : 'Перший'
                      : 'Невідомий'
                  }}
                  тиждень
                </p>
                <div class="week-schedule__days__week__days">
                  <button
                    v-for="(day, dayIndex) of week.days"
                    :key="dayIndex"
                    class="week-schedule__days__week__day"
                    :class="{ active: day.isToday, requested: day.isRequested }"
                    @click="
                      router.push({
                        params: { day: day.day, month: day.month + 1 },
                      })
                    "
                  >
                    <span>{{ dayNamesShort[dayIndex] }}</span>
                    <span> {{ day.day }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div id="schedule-table" v-if="pageObj?.isLoading === false">
            <div
              class="schedule-table__col"
              v-for="(day, dayIndex) of pageObj?.days"
              :key="dayIndex"
              :ref="(el) => (el ? dayRefs.push(el as Element) : '')"
              :class="{ active: day.isToday }"
            >
              <div class="schedule-table__col__head">
                <span class="schedule-table__col__head__day-number">{{
                  `${daysOfThisWeek[dayIndex].label}${
                    day.isToday ? ' - Сьогодні' : ''
                  }`
                }}</span>
                <span class="schedule-table__col__head__day-name">{{
                  dayNames[dayIndex]
                }}</span>
              </div>
              <div
                v-if="day.lessons && Object.keys(day.lessons).length > 0"
                class="schedule-table__col__lectures"
              >
                <div
                  class="schedule-table__col__lecture"
                  v-for="(lecturesOnTile, time, index) in day.lessons"
                  :key="index"
                >
                  <div
                    v-for="(lecture, index) in lecturesOnTile"
                    :key="index"
                    class="schedule-table__col__lecture__subgroup"
                    @click="
                      lessonDataOpened = {
                        id: lecture.code,
                        dayIndex,
                        week: dateFromRoute.week,
                        year: daysOfThisWeek[dayIndex].year,
                        group_code: route.params.group_code.toString(),
                        data: lecture,
                      }
                    "
                  >
                    <div class="schedule-table__col__lecture__subgroup__head">
                      <span
                        class="schedule-table__col__lecture__subgroup__head__time"
                        >{{
                          toHoursAndMinutes(lecture.time) +
                          ' - ' +
                          toHoursAndMinutes(lecture.time + lecture.duration)
                        }}
                      </span>
                      <div
                        class="schedule-table__col__lecture__subgroup__head__computed"
                      >
                        {{ lecture.canceled ? 'Скасовано' : '' }}
                      </div>
                    </div>
                    <div
                      class="schedule-table__col__lecture__subgroup__type-label"
                      :class="{
                        [`${lessonLabel(lecture.lesson_type).code}-global`]: true,
                      }"
                    >
                      <span
                        v-if="lecture.subgroup"
                        class="schedule-table__col__lecture__subgroup__type-label__number"
                        >{{ lecture.subgroup }}</span
                      >
                      <span
                        class="schedule-table__col__lecture__subgroup__type-label__name"
                        >{{ lessonLabel(lecture.lesson_type).label }}</span
                      >
                    </div>
                    <span class="schedule-table__col__lecture__subgroup__name">
                      {{ lecture.names[0] }}
                    </span>
                    <div
                      class="schedule-table__col__lecture__subgroup__lecturer"
                    >
                      {{ lecture.lecturers[0]?.surname }}
                      {{ lecture.lecturers[0]?.name?.[0] }}.
                      {{ lecture.lecturers[0]?.patronymic?.[0] }}.
                    </div>
                    <div class="schedule-table__col__lecture__subgroup__place">
                      <div v-for="(place, i) in lecture.places" :key="i">
                        <a
                          v-if="getPlaceEntry(place).link"
                          :href="getPlaceEntry(place).link ?? ''"
                          class="schedule-table__col__lecture__subgroup__place__row"
                          target="_blank"
                          rel="noopener noreferrer"
                          @click.stop=""
                        >
                          <IconGoogleMeet size="22" />
                          {{ getPlaceEntry(place).label }}
                        </a>
                        <span
                          v-else
                          class="schedule-table__col__lecture__subgroup__place__row"
                        >
                          <IconMapPin size="22" />
                          {{ getPlaceEntry(place).label }}
                        </span>
                      </div>
                    </div>
                    <div
                      v-if="
                        userStore.user?.permissions?.includes(
                          TMemberPermissions.addOnetimeChange,
                        )
                      "
                      class="schedule-table__col__lecture__subgroup__admin-actions"
                    >
                      <button
                        @click.stop="
                          lessonFormOpened = {
                            group_code: route.params.group_code.toString(),
                            id: lecture.code,
                            year: daysOfThisWeek[dayIndex].year,
                            month: daysOfThisWeek[dayIndex].month,
                            day: daysOfThisWeek[dayIndex].day,
                          }
                        "
                      >
                        Змінити
                      </button>
                      <button
                        @click.stop="
                          lessonChangeFormOpened = {
                            group_code: route.params.group_code.toString(),
                            lesson_code: lecture.code,
                            year: daysOfThisWeek[dayIndex].year,
                            month: daysOfThisWeek[dayIndex].month,
                            day: daysOfThisWeek[dayIndex].day,
                          }
                        "
                      >
                        Внести зміну
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="schedule-table__col__head__day-empty">
                <span>Пар немає</span>
              </div>
              <div
                v-if="
                  userStore.user?.permissions?.includes(
                    TMemberPermissions.addOnetimeChange,
                  )
                "
                class="schedule-table__col__head__day-actions"
                @click="
                  lessonFormOpened = {
                    group_code: route.params.group_code.toString(),
                    year: daysOfThisWeek[dayIndex].year,
                    month: daysOfThisWeek[dayIndex].month,
                    day: daysOfThisWeek[dayIndex].day,
                  }
                "
              >
                <button>Додати пару</button>
              </div>
            </div>
          </div>
        </div>
        <!-- <input type="text" :value="tgUser.initData" /> -->
      </div>
      <LessonView
        :state="lessonDataOpened"
        @lessonChangeFormOpened="lessonChangeFormOpened = $event"
        @close="lessonDataOpened = undefined"
      />
      <LessonForm
        :state="lessonFormOpened"
        @submit="
          (e: Lesson) => {
            if (lessonFormOpened?.id) {
              scheduleStore.updateLesson(e, route.params.group_code.toString())
            } else {
              scheduleStore.insertLesson(e, route.params.group_code.toString())
            }
            lessonFormOpened = undefined
          }
        "
        @close="lessonFormOpened = undefined"
      />
      <LessonChangeForm
        :state="lessonChangeFormOpened"
        @submit="
          (e: Partial<LessonChange>) => {
            if (lessonChangeFormOpened?.code) {
              scheduleStore.updateLessonChange(
                e,
                route.params.group_code.toString(),
              )
            } else {
              scheduleStore.insertLessonChange(
                e,
                route.params.group_code.toString(),
              )
            }
            lessonChangeFormOpened = undefined
          }
        "
        @close="lessonChangeFormOpened = undefined"
      />
    </main>
  </div>
  <!-- {{ user }}
  <button @click="logToken">log token</button> -->
</template>

<style>
main {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
#main-content {
  width: 100%;
  max-width: 1800px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
#schedule-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
#week-schedule {
  width: 100%;
  display: flex;
  flex-direction: column;
}
#week-schedule__topbar {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 24px 16px;
}
#week-schedule__date-and-buttons {
  width: 100%;
  height: 50px;
  height: auto;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 35px;
}
#week-schedule__date-p {
  width: 100%;
  max-width: 512px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  font-family: 'Rounded Mplus 1c Medium', 'Inter Regular';
  font-size: 24px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  font-size: clamp(16px, 2vw, 24px);
}
.week-schedule__date-part {
  text-align: center;
  white-space: nowrap;
}
.week-schedule__date-part.start,
.week-schedule__date-part.end {
  width: 100%;
  flex-grow: 1;
}
.week-schedule__date-part.mid {
  flex-grow: 0;
}
#week-schedule__week-number {
  width: 100%;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 8px;
  margin-bottom: 32px;
}
#week-schedule__days {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  /* justify-content: center; */
  overflow: auto hidden;
  flex-wrap: nowrap;
  gap: 8px;
  margin-top: 24px;
  margin-bottom: 24px;
}
.week-schedule__days__week {
  width: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  flex-shrink: 0;
}
.week-schedule__days__week__days {
  width: 100%;
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  gap: 4px;
}
.week-schedule__days__week__day {
  width: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  flex-shrink: 0;
  background: none;
  /* border: 2px solid #fff; */
}
.week-schedule__days__week__day.active {
  background-color: var(--tg-theme-hint-color);
}
.week-schedule__days__week__day.requested {
  background-color: #fff;
}
#schedule-table {
  width: 100%;
  /* max-width: 1400px; */
  height: auto;
  display: flex;
  flex-direction: row;
  border-radius: 50px;
  background: var(--tg-theme-secondary-bg-color), #f3f6fe;
  padding: 0 60px;
  overflow-x: auto;
  overflow-y: visible;
  scroll-snap-type: x mandatory;
}
.schedule-table__col {
  width: calc(100% / 7);
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  padding: 25px 5px 75px 5px;
  scroll-snap-align: center;
  scroll-snap-stop: always;
}
.schedule-table__col.active {
  background-color: var(--tg-theme-hint-color);
}
.schedule-table__col__head {
  width: 100%;
  min-height: 56px;
  height: fit-content;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}
.schedule-table__col__head__day-name {
  color: #404c77;
  text-align: center;
  font-family: 'Rounded Mplus 1c Medium', 'Inter Regular';
  font-size: 20px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}
.schedule-table__col__head__day-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.schedule-table__col__head__day-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.schedule-table__col__lectures {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.schedule-table__col__lecture {
  border-radius: 10px;
  background: var(--tg-theme-secondary-bg-color);
}
.schedule-table__col__lecture__subgroup {
  width: 100%;
  padding: 10px;
  padding-top: 5px;
}
.schedule-table__col__lecture__subgroup__head {
  height: 20px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.schedule-table__col__lecture__subgroup__type-label {
  width: 100%;
  height: 25px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-radius: 6px;
  /* color: #081236; */
  /* background-color: #f5f5f5; */
  font-family: 'M PLUS Rounded 1c', sans-serif;
  font-size: 14px;
  font-weight: bold;
}
.schedule-table__col__lecture__subgroup__type-label.lecture {
  color: var(--lecture-color);
  background-color: var(--lecture-bg-color);
}
.schedule-table__col__lecture__subgroup__type-label.lab {
  color: var(--lab-color);
  background-color: var(--lab-bg-color);
}
.schedule-table__col__lecture__subgroup__type-label.practical {
  color: var(--practical-color);
  background-color: var(--practical-bg-color);
}
.schedule-table__col__lecture__subgroup__type-label.seminar {
  color: var(--seminar-color);
  background-color: var(--seminar-bg-color);
}

.schedule-table__col__lecture__subgroup__type-label__number {
  width: 30px;
  height: calc(100% - 2px);
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1px 0 1px 1px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  line-height: normal;
}
.schedule-table__col__lecture__subgroup__type-label span {
  padding: 0 6px;
}
.schedule-table__col__lecture__subgroup__name {
  width: 100%;
  max-height: 80px;
  display: flex;
  margin: 15px 0;
  color: #081236;
  font-size: 14px;
  font-weight: 400;
  line-height: normal;
}
.schedule-table__col__lecture__subgroup__admin-actions {
  display: flex;
  flex-direction: row;
}
.schedule-table__col__lecture__subgroup__admin-actions button {
  padding: 4px 8px;
  border-radius: 7px;
}
.schedule-table__col__lecture__subgroup__place {
  display: flex;
  flex-direction: row;
  gap: 4px;
  margin: 12px 0;
}
.schedule-table__col__lecture__subgroup__place__row {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  color: #081236;
  font-size: 14px;
  font-weight: 400;
  line-height: normal;
}
@media screen and (max-width: 1024px) {
  #schedule-table {
    background: none;
    border-radius: 0;
    padding: 0;
  }
  .schedule-table__col {
    width: calc(100% - 20px);
    margin: 0 10px;
    border-radius: 25px;
    background: var(--tg-theme-secondary-bg-color), #f3f6fe;
    padding: 20px 15px 40px 15px;
  }
  .week-schedule__days__week {
    width: 100%;
  }
  .week-schedule__days__week__day {
    /* 4px gap */
    width: calc(calc(100% - 24px) / 7);
  }
}
</style>
