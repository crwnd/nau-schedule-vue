<script setup lang="ts">
import ModalTemplate from './ModalTemplate.vue'
import {
  type LessonChangeFormProps,
  type Lesson,
  PlaceType,
  type LessonChange,
} from '@/utils/types.d.js'
import { isUndefined, pad, placeType } from '@/utils/functions.js'
import { useScheduleStore } from '@/stores/schedule'
import { ref, watch } from 'vue'
const scheduleStore = useScheduleStore()

const props = defineProps<{ state: LessonChangeFormProps | undefined }>()
const emit = defineEmits<{
  (eventName: 'close', eventValue: void): void
  (eventName: 'submit', eventValue: Partial<LessonChange>): void
}>()

const currentDate = new Date()
const lessonChange = ref<
  Partial<LessonChange> & Pick<LessonChange, 'start_date' | 'end_date'>
>({
  lesson_code: '',
  template: undefined,
  lecturers: undefined,
  comment: undefined,
  names: undefined,
  time: undefined,
  duration: undefined,
  places: undefined,
  lesson_type: undefined,
  recordings: undefined,
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

const applyTemplate = (e: Event) => {
  const target = e.target as HTMLSelectElement
  const templates = scheduleStore.getSpecialityTemplates(
    props.state?.group_code as string,
  )
  const template = templates.find((t) => t.id === target.value)
  if (!template) {
    lessonChange.value.template = null
    return
  }
  lessonChange.value.template = template.id
  Object.entries(template).forEach(([key, value]) => {
    if (!isUndefined(value)) {
      lessonChange.value = {
        ...lessonChange.value,
        [key as keyof Lesson]: value,
      }
    }
  })
}

watch(
  () => props.state?.lesson_code,
  (lesson_code) => {
    if (!lesson_code) return
    lessonChange.value.lesson_code = lesson_code
  },
)

watch(
  () => props.state?.code,
  async (code) => {
    if (!code || !props.state?.group_code) return
    lessonChange.value = await scheduleStore.getLessonChange(
      props.state?.group_code,
      code,
    )
  },
  { immediate: true },
)
scheduleStore.loadLecturers()
</script>
<template>
  <ModalTemplate :state="!!state" @close="emit('close')">
    <template v-slot:headerLeft>
      <span>Зміна пари</span>
    </template>
    <template v-slot:headerCenter>
      <!-- <span>Lesson</span> -->
    </template>
    <div>
      <form
        @submit.prevent="emit('submit', lessonChange)"
        style="padding: 12px"
      >
        <p>Пресети</p>
        <input
          type="checkbox"
          id="lesson-template-checkbox"
          :checked="!isUndefined(lessonChange.template)"
          @change="
            lessonChange.template = ($event.target as HTMLInputElement).checked
              ? null
              : undefined
          "
        />
        <label for="lesson-template-checkbox">Використати пресет</label>
        <select
          v-if="state?.group_code && !isUndefined(lessonChange.template)"
          :value="lessonChange.template"
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
        <p>Назва пари</p>
        <input
          type="checkbox"
          id="lesson-names-checkbox"
          :checked="!isUndefined(lessonChange.names)"
          @change="
            lessonChange.names = ($event.target as HTMLInputElement).checked
              ? ['']
              : undefined
          "
        />
        <label for="lesson-names-checkbox">Змінити назву</label>
        <div
          v-if="
            !isUndefined(lessonChange.names) &&
            Array.isArray(lessonChange.names)
          "
        >
          <div v-for="(name, i) in lessonChange.names" :key="`${name}-${i}`">
            {{ i + 1 }}.
            <input
              v-model="lessonChange.names[i]"
              type="text"
              :placeholder="i === 0 ? 'Українською' : 'Англійською'"
              name="lesson-name"
              id="lesson-form__lesson-name"
            />
            <button
              v-if="lessonChange.names.length > 1"
              @click="lessonChange.names.splice(i, 1)"
              type="button"
            >
              X
            </button>
          </div>
          <button
            v-if="lessonChange.names.length < 2"
            @click="
              Array.isArray(lessonChange.names)
                ? lessonChange.names.push('')
                : (lessonChange.names = [''])
            "
            type="button"
          >
            + Назва
          </button>
        </div>
        <p>Викладач</p>
        <input
          type="checkbox"
          id="lesson-lecturers-checkbox"
          :checked="!isUndefined(lessonChange.lecturers)"
          @change="
            lessonChange.lecturers = ($event.target as HTMLInputElement).checked
              ? ['']
              : undefined
          "
        />
        <label for="lesson-lecturers-checkbox">Змінити викладача</label>
        <div v-if="Array.isArray(lessonChange.lecturers)">
          <div
            v-for="(lecturerCode, i) in lessonChange.lecturers"
            :key="lecturerCode"
          >
            <select v-model="lessonChange.lecturers[i]">
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
            <button
              v-if="lessonChange.lecturers && lessonChange.lecturers.length > 1"
              @click="lessonChange.lecturers.splice(i, 1)"
            >
              X
            </button>
          </div>
          <button
            v-if="lessonChange.lecturers.length < 2"
            @click="
              Array.isArray(lessonChange.lecturers)
                ? lessonChange.lecturers.push('')
                : (lessonChange.lecturers = [''])
            "
            type="button"
          >
            + Викладач
          </button>
        </div>
        <p>Тип</p>
        <input
          type="checkbox"
          id="lesson-lesson_type-checkbox"
          :checked="!isUndefined(lessonChange.lesson_type)"
          @change="
            lessonChange.lesson_type = ($event.target as HTMLInputElement)
              .checked
              ? 'lecture'
              : undefined
          "
        />
        <label for="lesson-lesson_type-checkbox">Змінити тип</label>
        <select
          v-if="!isUndefined(lessonChange.lesson_type)"
          v-model="lessonChange.lesson_type"
        >
          <option value="lecture">Лекція</option>
          <option value="practical">Практика</option>
          <option value="lab">Лабораторна</option>
        </select>
        <p>Час</p>
        <input
          type="checkbox"
          id="lesson-time-checkbox"
          :checked="!isUndefined(lessonChange.time)"
          @change="
            lessonChange.time = ($event.target as HTMLInputElement).checked
              ? 0
              : undefined
          "
        />
        <label for="lesson-time-checkbox">Змінити час</label>
        <VueDatePicker
          v-if="!isUndefined(lessonChange.time)"
          :model-value="{
            hours: Math.floor((lessonChange.time ?? 0) / 60),
            minutes: (lessonChange.time ?? 0) % 60,
          }"
          time-picker
          :clearable="false"
          @update:model-value="
            lessonChange.time = $event.hours * 60 + $event.minutes
          "
        />
        <!-- <input
          v-if="!isUndefined(lessonChange.time)"
          :value="`${pad(Math.floor((lessonChange.time ?? 0) / 60), 2)}:${pad(
            (lessonChange.time ?? 0) % 60,
            2,
          )}`"
          type="time"
          name="lesson-time"
          id="lesson-form__lesson-time"
          @change="
            lessonChange.time = ($event.target as HTMLInputElement).value
              .split(':')
              .map((v) => parseInt(v))
              .reduce((acc, cur, i) => acc + cur * (i === 0 ? 60 : 1), 0)
          "
        /> -->
        <p>Тривалість</p>
        <input
          type="checkbox"
          id="lesson-duration-checkbox"
          :checked="!isUndefined(lessonChange.duration)"
          @change="
            lessonChange.duration = ($event.target as HTMLInputElement).checked
              ? 0
              : undefined
          "
        />
        <label for="lesson-duration-checkbox">Змінити тривалість</label>
        <VueDatePicker
          v-if="!isUndefined(lessonChange.duration)"
          :model-value="{
            hours: Math.floor((lessonChange.duration ?? 0) / 60),
            minutes: (lessonChange.duration ?? 0) % 60,
          }"
          time-picker
          :clearable="false"
          @update:model-value="
            lessonChange.duration = $event.hours * 60 + $event.minutes
          "
        />
        <!-- <input
          v-if="!isUndefined(lessonChange.duration)"
          :value="`${pad(Math.floor((lessonChange.duration ?? 0) / 60), 2)}:${pad(
            (lessonChange.duration ?? 0) % 60,
            2,
          )}`"
          type="time"
          name="lesson-duration"
          id="lesson-form__lesson-duration"
          @change="
            lessonChange.duration = ($event.target as HTMLInputElement).value
              .split(':')
              .map((v) => parseInt(v))
              .reduce((acc, cur, i) => acc + cur * (i === 0 ? 60 : 1), 0)
          "
        /> -->
        <p>Початок</p>
        <VueDatePicker
          :model-value="
            new Date(
              lessonChange.start_date[0],
              lessonChange.start_date[1] - 1,
              lessonChange.start_date[2],
            )
          "
          :enable-time-picker="false"
          :clearable="false"
          @update:model-value="
            lessonChange.start_date = [
              $event.getFullYear(),
              $event.getMonth() + 1,
              $event.getDate(),
            ]
          "
        />
        <!-- <input
          :value="
            lessonChange.start_date
              ?.map((e, i) => (i !== 0 ? pad(e, 2) : e.toString()))
              .join('-')
          "
          type="date"
          name="lesson-start-date"
          id="lesson-form__lesson-start-date"
          @change="
            lessonChange.start_date = ($event.target as HTMLInputElement).value
              .split('-')
              .map((v) => parseInt(v))
          "
        /> -->
        <p>Кінець</p>
        <VueDatePicker
          :model-value="
            new Date(
              lessonChange.end_date[0],
              lessonChange.end_date[1] - 1,
              lessonChange.end_date[2],
            )
          "
          :enable-time-picker="false"
          :clearable="false"
          @update:model-value="
            lessonChange.end_date = [
              $event.getFullYear(),
              $event.getMonth() + 1,
              $event.getDate(),
            ]
          "
        />
        <!-- <input
          :value="
            lessonChange.end_date
              ?.map((e, i) => (i !== 0 ? pad(e, 2) : e.toString()))
              .join('-')
          "
          type="date"
          name="lesson-end-date"
          id="lesson-form__lesson-end-date"
          :min="
            lessonChange.start_date
              ?.map((e, i) => (i !== 0 ? pad(e, 2) : e.toString()))
              .join('-')
          "
          @change="
            lessonChange.end_date = ($event.target as HTMLInputElement).value
              .split('-')
              .map((v) => parseInt(v))
          "
        /> -->
        <p>Статус</p>
        <input
          type="checkbox"
          id="lesson-canceled-checkbox"
          :checked="!isUndefined(lessonChange.canceled)"
          @change="
            lessonChange.canceled = ($event.target as HTMLInputElement).checked
              ? false
              : undefined
          "
        />
        <label for="lesson-canceled-checkbox">Змінити статус</label>
        <div v-if="!isUndefined(lessonChange.canceled)">
          <input
            v-model="lessonChange.canceled"
            type="checkbox"
            name="lesson-canceled"
            id="lesson-form__lesson-canceled"
          />
          <label for="lesson-form__lesson-canceled">Скасовано</label>
        </div>
        <p>Місця проведення</p>
        <input
          type="checkbox"
          id="lesson-places-checkbox"
          :value="!isUndefined(lessonChange.places)"
          @change="
            lessonChange.places = ($event.target as HTMLInputElement).checked
              ? []
              : undefined
          "
        />
        <label for="lesson-places-checkbox">Змінити місця</label>
        <div
          v-if="
            !isUndefined(lessonChange.places) &&
            Array.isArray(lessonChange.places)
          "
        >
          <div v-for="(name, i) in lessonChange.places" :key="`${name}-${i}`">
            {{ i + 1 }}.
            <input
              v-model="lessonChange.places[i].text"
              type="text"
              name="lesson-name"
              id="lesson-form__lesson-name"
            />
            <select v-model="lessonChange.places[i].place_type">
              <option
                v-for="place_type in Object.entries(placeType)"
                :key="place_type[0]"
                :value="place_type[0]"
              >
                {{ place_type[1] }}
              </option>
            </select>
            <button
              v-if="lessonChange.places?.length > 1"
              @click="lessonChange.places.splice(i, 1)"
            >
              X
            </button>
          </div>
          <button
            v-if="lessonChange.places.length < 5"
            @click="
              Array.isArray(lessonChange.places)
                ? lessonChange.places.push({
                    text: '',
                    place_type: PlaceType.offline_classroom,
                  })
                : (lessonChange.places = [
                    { text: '', place_type: PlaceType.offline_classroom },
                  ])
            "
          >
            + Місце
          </button>
        </div>
        <button type="submit">
          {{ lessonChange.code ? 'Зберегти' : 'Створити' }}
        </button>
        <p>{{ lessonChange }}</p>
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
