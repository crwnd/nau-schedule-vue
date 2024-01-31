<script setup lang="ts">
import ModalTemplate from './ModalTemplate.vue'
import {
  TMemberPermissions,
  type LessonDataOpened,
  type LessonChangeFormProps,
} from '@/utils/types.d.js'
import {
  toHoursAndMinutes,
  lessonLabel,
  getDateFromWeek,
} from '@/utils/functions.js'
import { useScheduleStore } from '@/stores/schedule'
// import { useAuth0 } from '@auth0/auth0-vue'
import { useUserStore } from '@/stores/user'
import { computed, watch } from 'vue'
const scheduleStore = useScheduleStore()
const userStore = useUserStore()

const props = defineProps<{ state: LessonDataOpened | undefined }>()
const emit = defineEmits<{
  (eventName: 'close', eventValue: void): void
  (eventName: 'lessonChangeFormOpened', eventValue: LessonChangeFormProps): void
}>()

const subgroupLabel = {
  0: 'Обидві підгрупи',
  1: 'Перша підгрупа',
  2: 'Друга підгрупа',
}

const changes = computed(() =>
  props.state?.data?.code
    ? scheduleStore.lessonChanges.filter(
        (change) =>
          change.lesson_code === props.state?.data?.code &&
          change.isLoading === false,
      )
    : [],
)
const areChangesLoading = computed(() =>
  scheduleStore.lessonChanges.some(
    (change) =>
      change.lesson_code === props.state?.data?.code &&
      change.isLoading === true,
  ),
)

watch(
  () => props.state?.data?.code,
  () => {
    props.state?.data?.code &&
      scheduleStore.getLessonChanges(
        props.state?.data?.code,
        props.state?.group_code,
      )
  },
)
</script>
<template>
  <ModalTemplate :state="!!state" @close="emit('close')">
    <template v-slot:headerLeft>
      <span>Пара</span>
    </template>
    <template v-slot:headerCenter>
      <!-- <span>Lesson</span> -->
    </template>
    <div v-if="state?.data">
      <div
        class="lesson-modal-content__body__name"
        :class="{
          [`${lessonLabel(state.data.lesson_type).code}-global`]: true,
        }"
      >
        <span>{{ state.data.names[0] }}</span>
      </div>
      <div class="lesson-modal-content__body__info">
        <div class="lesson-modal-content__body__info__col1">
          <span>{{
            toHoursAndMinutes(state.data.time) +
            ' - ' +
            toHoursAndMinutes(state.data.time + state.data.duration)
          }}</span>
          <span>{{ state.data.places?.map((el) => el.text).join(', ') }}</span>
        </div>
        <div class="lesson-modal-content__body__info__col2">
          <span>{{ subgroupLabel[state.data.subgroup] }}</span>
          <span>{{ lessonLabel(state.data.lesson_type).label }}</span>
        </div>
      </div>
      <p class="lesson-modal-content__body__info__lecturers">
        <span class="lesson-modal-content__body__info__lecturers__label"
          >Викладачі:</span
        >
        <span
          v-for="(lecturer, index) of state.data.lecturers"
          :key="index"
          class="lesson-modal-content__body__info__lecturer"
          >{{ lecturer.surname }} {{ lecturer.name[0] }}.
          {{ lecturer.patronymic[0] }}.</span
        >
      </p>
      <textarea
        cols="30"
        rows="10"
        class="lesson-modal-content__body__info__comment"
        :value="state.data.comment"
        placeholder="Нотатки..."
        :readonly="
          !userStore.user?.permissions?.includes(
            TMemberPermissions.addOnetimeChange,
          )
        "
        @input="
          (e) =>
            scheduleStore.commentInputHandler(
              (e.target as HTMLTextAreaElement).value,
              state!.id,
              state!.dayIndex,
              state!.week,
              state!.year,
              state!.group_code,
            )
        "
      ></textarea>
      <div class="actions">
        <button
          v-if="
            userStore.user?.permissions?.includes(
              TMemberPermissions.addOnetimeChange,
            )
          "
          @click="
            (e) => {
              scheduleStore.makeUpdate(
                { canceled: !state?.data.canceled },
                state!.id,
                state!.dayIndex,
                state!.week,
                state!.year,
                state!.group_code,
              )
              state!.data.canceled = !state?.data.canceled
            }
          "
        >
          {{ `${state?.data.canceled ? 'Відновити' : 'Скасувати'} пару` }}
        </button>
      </div>
      <div
        v-if="
          userStore.user?.permissions.includes(
            TMemberPermissions.addOnetimeChange,
          )
        "
        class="lesson-changes"
      >
        <div v-if="areChangesLoading">
          <p>Завантаження...</p>
        </div>
        <div v-else-if="!changes?.length">
          <p>Змін ще немає</p>
        </div>
        <div v-else>
          <p>Зміни:</p>
          <p
            v-for="change in changes"
            :key="change.code"
            @click="
              emit('lessonChangeFormOpened', {
                group_code: state.group_code,
                lesson_code: state.id,
                code: change.code,
                year: state.year,
                month:
                  getDateFromWeek(
                    state.dayIndex,
                    state.week,
                    state.year,
                  ).getMonth() + 1,
                day: getDateFromWeek(
                  state.dayIndex,
                  state.week,
                  state.year,
                ).getDate(),
              })
            "
          >
            {{
              `${change.start_date[2]}.${change.start_date[1]}.${change.start_date[0]} - ${change.end_date[2]}.${change.end_date[1]}.${change.end_date[0]}`
            }}
          </p>
        </div>
      </div>
      <div
        v-if="
          userStore.user?.permissions.includes(TMemberPermissions.removeLessons)
        "
        class="lesson-changes"
      >
        <button
          @click="
            (e) => {
              scheduleStore.deleteLesson(state!.id, state!.group_code)
            }
          "
        >
          Видалити повністю
        </button>
      </div>
      <div class="infos">
        <div>
          <span>Дозвіл на редагування:</span>
          <span
            v-if="
              userStore.user?.permissions?.includes(
                TMemberPermissions.addOnetimeChange,
              )
            "
            >Є</span
          >
          <span v-else>Немає</span>
        </div>
        <p>
          Дозволи:
          {{ userStore.user?.permissions }}
        </p>
      </div>
    </div>
  </ModalTemplate>
</template>
<style scoped>
.lesson-modal-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.5);
  visibility: hidden;
  opacity: 0;
  transition: all 0.1s ease-out;
  will-change: opacity, visibility;
}
.lesson-modal-container.active {
  visibility: visible;
  opacity: 1;
}
.lesson-modal-content {
  width: 100%;
  max-width: 360px;
  min-height: 360px;
  height: fit-content;
  max-height: 720px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background-color: #fff;
  border-radius: 28px;
  transition: all 0.1s ease-out;
  transform: scale(1.1);
  /* will-change: transform, height; */
  overflow: hidden;
  overscroll-behavior: contain;
}
.active .lesson-modal-content {
  transform: scale(1);
}
.lesson-modal-content__head {
  width: 100%;
  height: 80px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
}
.lesson-modal-content__body {
  width: 100%;
  overflow: hidden scroll;
}

.lesson-modal-content__body__name {
  width: 100%;
  height: fit-content;
  min-height: 54px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 8px 16px;
  /* background-color: #8aacee;
  color: #fff; */
}
.lesson-modal-content__body__info {
  width: 100%;
  height: fit-content;
  min-height: 54px;
  display: flex;
  flex-direction: row;
}
.lesson-modal-content__body__info__col1,
.lesson-modal-content__body__info__col2 {
  width: 50%;
  height: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.lesson-modal-content__body__info__lecturers {
  width: 100%;
  padding: 0 36px;
}
.lesson-modal-content__body__info__lecturers__label {
  margin-right: 8px;
}
.lesson-modal-content__body__info__comment {
  width: calc(100% - 72px);
  margin: 36px;
  padding: 16px;
  background-color: #d1e0ff;
  color: #2f487a;
  border: none;
  border-radius: 16px;
}
.actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px 16px;
}
.infos {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 16px;
}
@media screen and (max-width: 810px) {
  .lesson-modal-container {
    justify-content: flex-end;
  }
  .lesson-modal-content {
    height: 100%;
    max-height: 80%;
    max-width: 100%;
    top: 20%;
    border-radius: 28px 28px 0 0;
    transition: all 0.2s ease-out;
  }
  .lesson-modal-content {
    transform: translateY(100%);
  }
  .active .lesson-modal-content {
    transform: translateY(0);
  }
}
</style>
