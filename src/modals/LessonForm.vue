<script setup lang="ts">
import ModalTemplate from './ModalTemplate.vue'
import {
  type LessonFormProps,
  type Lesson,
  PlaceType,
} from '@/utils/types.d.js'
import { isUndefined, pad, placeType } from '@/utils/functions.js'
import { useScheduleStore } from '@/stores/schedule'
import { computed, ref, watch } from 'vue'
import { useGroupsStore } from '@/stores/groups'
const scheduleStore = useScheduleStore()
const groupsStore = useGroupsStore()

const props = defineProps<{ state: LessonFormProps | undefined }>()
const emit = defineEmits<{
  (eventName: 'close', eventValue: void): void
  (eventName: 'submit', eventValue: Lesson): void
}>()

const currentDate = new Date()
const lesson = ref<Lesson>({
  day_number: 1,
  week_number: 1,
  template: undefined,
  lecturers: undefined,
  subgroup: 0,
  comment: undefined,
  names: [''],
  time: 480,
  duration: 95,
  places: [],
  lesson_type: 'lecture',
  recordings: [],
  start_date: [
    props.state?.year ?? currentDate.getFullYear(),
    props.state?.month ?? currentDate.getMonth() + 1,
    props.state?.day ?? currentDate.getDate(),
  ],
  end_date: [
    props.state?.year ?? currentDate.getFullYear(),
    props.state?.month ?? currentDate.getMonth() + 1,
    props.state?.day ?? currentDate.getDate(),
  ],
})

const template = computed(() => {
  const templates = scheduleStore.getSpecialityTemplates(
    props.state?.group_code as string,
  )
  return templates.find(
    (t) =>
      t.id === lesson.value.template ||
      (lesson.value.template?.startsWith('-') &&
        t.id === lesson.value.template.substring(1)),
  )
})

const applyTemplate = (e: Event) => {
  const target = e.target as HTMLSelectElement
  const templates = scheduleStore.getSpecialityTemplates(
    props.state?.group_code as string,
  )
  const template = templates.find(
    (t) => t.id === target.value || t.id === `-${target.value}`,
  )
  if (!template) {
    lesson.value.template = null
    return
  }
  lesson.value.template = `-${template.id}`
  // Object.entries(template).forEach(([key, value]) => {
  //   if (typeof value !== 'undefined') {
  //     lesson.value = {
  //       ...lesson.value,
  //       [key as keyof Lesson]: value,
  //     }
  //   }
  // })
}

watch(
  () => props.state?.id,
  async (code) => {
    if (!code || !props.state?.group_code) return
    lesson.value = await scheduleStore.getLesson(props.state?.group_code, code)
  },
  { immediate: true },
)
scheduleStore.loadLecturers()
</script>
<template>
  <ModalTemplate :state="!!state" @close="emit('close')">
    <template v-slot:headerLeft>
      <span>Пара</span>
    </template>
    <template v-slot:headerCenter>
      <!-- <span>Lesson</span> -->
    </template>
    <div>
      <form @submit.prevent="emit('submit', lesson)" style="padding: 12px">
        <h3>Пресети</h3>
        <input
          type="checkbox"
          id="lesson-template-checkbox"
          :checked="!isUndefined(lesson.template)"
          @change="
            lesson.template = ($event.target as HTMLInputElement).checked
              ? null
              : undefined
          "
        />
        <label for="lesson-template-checkbox">Використати пресет</label>
        <br />
        <!-- <select
          v-if="
            !isUndefined(lesson.template) &&
            state?.group_code &&
            lesson?.template
          "
          :value="lesson?.template"
          @change="
            (e) => {
              if ((e.target as HTMLSelectElement).value === 'spec') {
                lesson.template = lesson.template?.startsWith('-')
                  ? lesson.template
                  : `-${lesson.template}`
              }
            }
          "
        >
          <option value="spec" :selected="lesson.template?.startsWith('-')">
            Спеціальності
          </option>
        </select> -->
        <select
          v-if="!isUndefined(lesson.template) && state?.group_code"
          :value="lesson?.template?.substring(1)"
          @change="applyTemplate($event)"
        >
          <option :value="null">Нічого</option>
          <option
            v-for="(preset, i) in scheduleStore.getSpecialityTemplates(
              state.group_code,
            )"
            :key="i"
            :value="preset.id"
          >
            {{ `${preset.id} - ${preset.names[0]}` }}
          </option>
        </select>
        <h3>Назва пари</h3>
        <p v-if="template?.names">Пресет: {{ template.names }}</p>
        <input
          type="checkbox"
          id="lesson-names-checkbox"
          :checked="!isUndefined(lesson.names)"
          @change="
            lesson.names = ($event.target as HTMLInputElement).checked
              ? []
              : undefined
          "
        />
        <label for="lesson-names-checkbox">Вказати</label>
        <div v-if="!isUndefined(lesson.names) && Array.isArray(lesson.names)">
          <div v-for="(name, i) in lesson.names" :key="i">
            {{ i + 1 }}.
            <input
              v-model="lesson.names[i]"
              :key="i"
              type="text"
              :placeholder="i === 0 ? 'Українською' : 'Англійською'"
              name="lesson-name"
              id="lesson-form__lesson-name"
            />
            <button
              v-if="lesson.names.length > 1"
              type="button"
              @click="lesson.names.splice(i, 1)"
            >
              X
            </button>
          </div>
        </div>
        <button
          v-if="
            !isUndefined(lesson.names) &&
            (!Array.isArray(lesson.names) || lesson.names.length < 2)
          "
          type="button"
          @click="
            Array.isArray(lesson.names)
              ? lesson.names.push('')
              : (lesson.names = [''])
          "
        >
          + Назва
        </button>
        <h3>Викладач</h3>
        <p v-if="template?.lecturers">Пресет: {{ template.lecturers }}</p>
        <input
          type="checkbox"
          id="lesson-lecturers-checkbox"
          :checked="!isUndefined(lesson.lecturers)"
          @change="
            lesson.lecturers = ($event.target as HTMLInputElement).checked
              ? []
              : undefined
          "
        />
        <label for="lesson-lecturers-checkbox">Вказати</label>
        <div
          v-if="
            !isUndefined(lesson.lecturers) && Array.isArray(lesson.lecturers)
          "
        >
          <div v-for="(code, index) in lesson.lecturers" :key="index">
            <select
              :value="code"
              @change="
                lesson.lecturers[index] = (
                  $event?.target as HTMLSelectElement
                ).value
              "
            >
              <option :value="null">Ніхто</option>
              <option
                v-for="lecturer in scheduleStore.lecturers"
                :key="lecturer.code"
                :value="lecturer.code"
              >
                {{
                  `${lecturer.surname} ${lecturer.name} ${lecturer.patronymic}`
                }}
              </option>
            </select>
            <button type="button" @click="lesson.lecturers.splice(index, 1)">
              X
            </button>
          </div>
        </div>
        <button
          v-if="
            !isUndefined(lesson.lecturers) &&
            (!Array.isArray(lesson.lecturers) || lesson.lecturers.length < 2)
          "
          type="button"
          @click="
            Array.isArray(lesson.lecturers)
              ? lesson.lecturers.push('')
              : (lesson.lecturers = [''])
          "
        >
          + Викладач
        </button>
        <h3>День</h3>
        <select v-model="lesson.day_number">
          <option value="1">Понеділок</option>
          <option value="2">Вівторок</option>
          <option value="3">Середа</option>
          <option value="4">Четвер</option>
          <option value="5">П'ятниця</option>
          <option value="6">Субота</option>
          <option value="7">Неділя</option>
        </select>
        <h3>Тиждень</h3>
        <select v-model="lesson.week_number">
          <option value="1">Перший</option>
          <option value="2">Другий</option>
        </select>
        <h3>Підгрупа</h3>
        <select v-model="lesson.subgroup">
          <option :value="0">Обидві</option>
          <option
            v-if="
              groupsStore.groups.find((g) => g.code === state?.group_code)
                ?.has_second_subgroup
            "
            :value="1"
          >
            Перша
          </option>
          <option
            v-if="
              groupsStore.groups.find((g) => g.code === state?.group_code)
                ?.has_second_subgroup
            "
            :value="2"
          >
            Друга
          </option>
        </select>
        <h3>Тип</h3>
        <p v-if="template?.lesson_type">Пресет: {{ template.lesson_type }}</p>
        <input
          type="checkbox"
          id="lesson-lesson_type-checkbox"
          :checked="!isUndefined(lesson.lesson_type)"
          @change="
            lesson.lesson_type = ($event.target as HTMLInputElement).checked
              ? 'lecture'
              : undefined
          "
        />
        <label for="lesson-lesson_type-checkbox">Вказати</label>
        <select
          v-if="!isUndefined(lesson.lesson_type)"
          v-model="lesson.lesson_type"
        >
          <option value="lecture">Лекція</option>
          <option value="practical">Практика</option>
          <option value="lab">Лабораторна</option>
        </select>
        <h3>Час</h3>
        <VueDatePicker
          :model-value="{
            hours: Math.floor((lesson.time ?? 0) / 60),
            minutes: (lesson.time ?? 0) % 60,
          }"
          time-picker
          :clearable="false"
          @update:model-value="lesson.time = $event.hours * 60 + $event.minutes"
        />
        <!-- <input
          :value="`${pad(Math.floor((lesson.time ?? 0) / 60), 2)}:${pad(
            (lesson.time ?? 0) % 60,
            2,
          )}`"
          type="time"
          name="lesson-time"
          id="lesson-form__lesson-time"
          @change="
            lesson.time = ($event.target as HTMLInputElement).value
              .split(':')
              .map((v) => parseInt(v))
              .reduce((acc, cur, i) => acc + cur * (i === 0 ? 60 : 1), 0)
          "
        /> -->
        <h3>Тривалість</h3>
        <p v-if="template?.duration">
          Пресет:
          {{
            `${pad(Math.floor((template.duration ?? 0) / 60), 2)}:${pad(
              (template.duration ?? 0) % 60,
              2,
            )}`
          }}
        </p>
        <input
          type="checkbox"
          id="lesson-duration-checkbox"
          :checked="!isUndefined(lesson.duration)"
          @change="
            lesson.duration = ($event.target as HTMLInputElement).checked
              ? template?.duration ?? 0
              : undefined
          "
        />
        <label for="lesson-duration-checkbox">Вказати</label>
        <VueDatePicker
          v-if="!isUndefined(lesson.duration)"
          :model-value="{
            hours: Math.floor((lesson.duration ?? 0) / 60),
            minutes: (lesson.duration ?? 0) % 60,
          }"
          time-picker
          :clearable="false"
          @update:model-value="
            lesson.duration = $event.hours * 60 + $event.minutes
          "
        />
        <!-- <input
          :value="`${pad(Math.floor((lesson.duration ?? 0) / 60), 2)}:${pad(
            (lesson.duration ?? 0) % 60,
            2,
          )}`"
          type="time"
          name="lesson-duration"
          id="lesson-form__lesson-duration"
          @change="
            lesson.duration = ($event.target as HTMLInputElement).value
              .split(':')
              .map((v) => parseInt(v))
              .reduce((acc, cur, i) => acc + cur * (i === 0 ? 60 : 1), 0)
          "
        /> -->
        <h3>Початок</h3>
        <VueDatePicker
          :model-value="
            new Date(
              lesson.start_date[0],
              lesson.start_date[1] - 1,
              lesson.start_date[2],
            )
          "
          :enable-time-picker="false"
          :clearable="false"
          @update:model-value="
            lesson.start_date = [
              $event.getFullYear(),
              $event.getMonth() + 1,
              $event.getDate(),
            ]
          "
        />
        <!-- <input
          :value="
            lesson.start_date
              .map((e, i) => (i !== 0 ? pad(e, 2) : e.toString()))
              .join('-')
          "
          type="date"
          name="lesson-start-date"
          id="lesson-form__lesson-start-date"
          @change="
            lesson.start_date = ($event.target as HTMLInputElement).value
              .split('-')
              .map((v) => parseInt(v))
          "
        /> -->
        <h3>Кінець</h3>
        <VueDatePicker
          :model-value="
            new Date(
              lesson.end_date[0],
              lesson.end_date[1] - 1,
              lesson.end_date[2],
            )
          "
          :enable-time-picker="false"
          :clearable="false"
          @update:model-value="
            lesson.end_date = [
              $event.getFullYear(),
              $event.getMonth() + 1,
              $event.getDate(),
            ]
          "
        />
        <!-- <input
          :value="
            lesson.end_date
              .map((e, i) => (i !== 0 ? pad(e, 2) : e.toString()))
              .join('-')
          "
          type="date"
          name="lesson-end-date"
          id="lesson-form__lesson-end-date"
          :min="
            lesson.start_date
              .map((e, i) => (i !== 0 ? pad(e, 2) : e.toString()))
              .join('-')
          "
          @change="
            lesson.end_date = ($event.target as HTMLInputElement).value
              .split('-')
              .map((v) => parseInt(v))
          "
        /> -->
        <h3>Місце</h3>
        <p v-if="template?.places">
          Пресет:
          {{ template.places }}
        </p>
        <input
          type="checkbox"
          id="lesson-places-checkbox"
          :checked="!isUndefined(lesson.places)"
          @change="
            lesson.places = ($event.target as HTMLInputElement).checked
              ? []
              : undefined
          "
        />
        <label for="lesson-places-checkbox">Вказати</label>
        <div v-if="Array.isArray(lesson.places)">
          <div v-for="(name, i) in lesson.places" :key="`${name}-${i}`">
            {{ i + 1 }}.
            <input
              v-model="lesson.places[i].text"
              type="text"
              name="lesson-name"
              id="lesson-form__lesson-name"
            />
            <select v-model="lesson.places[i].place_type">
              <option
                v-for="place_type in Object.entries(placeType)"
                :key="place_type[0]"
                :value="place_type[0]"
              >
                {{ place_type[1] }}
              </option>
            </select>
            <button type="button" @click="lesson.places.splice(i, 1)">X</button>
          </div>
        </div>
        <button
          v-if="
            !isUndefined(lesson.places) &&
            (!Array.isArray(lesson.places) || lesson.places.length < 5)
          "
          type="button"
          @click="
            Array.isArray(lesson.places)
              ? lesson.places.push({
                  text: '',
                  place_type: PlaceType.offline_classroom,
                })
              : (lesson.places = [
                  { text: '', place_type: PlaceType.offline_classroom },
                ])
          "
        >
          + Місце
        </button>
        <h3>Скасовано</h3>
        <p v-if="template?.canceled">
          Пресет:
          {{ template.canceled }}
        </p>
        <input
          type="checkbox"
          id="lesson-canceled-checkbox"
          :checked="!isUndefined(lesson.canceled)"
          @change="
            lesson.canceled = ($event.target as HTMLInputElement).checked
              ? false
              : undefined
          "
        />
        <label for="lesson-canceled-checkbox">Вказати</label>
        <SwitchInput
          v-if="!isUndefined(lesson.canceled)"
          :checked="lesson.canceled"
          id="lesson-form__lesson-canceled"
          name="lesson-form__lesson-canceled"
          @change="lesson.canceled = $event"
        />
        <button type="submit">
          {{ lesson.code ? 'Зберегти' : 'Створити' }}
        </button>
        {{ lesson }}
      </form>
    </div>
  </ModalTemplate>
</template>
<style scoped>
form * {
  max-width: 100%;
}
form button[type='submit'] {
  width: 100%;
  margin-top: 16px;
}
</style>
