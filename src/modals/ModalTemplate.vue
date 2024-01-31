<script setup lang="ts">
const props = defineProps<{ state: boolean | undefined }>()
const emit = defineEmits<{ (eventName: 'close', eventValue: void): void }>()
</script>
<template>
  <div
    class="lesson-modal-container"
    :class="{ active: props.state }"
    @click="emit('close')"
  >
    <div class="lesson-modal-content" @click.stop>
      <div class="lesson-modal-content__head">
        <div class="lesson-modal-content__head__left">
          <slot name="headerLeft"></slot>
        </div>
        <div class="lesson-modal-content__head__center">
          <slot name="headerCenter"></slot>
        </div>
        <div class="lesson-modal-content__head__right">
          <button @click="emit('close')">
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
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div class="lesson-modal-content__body">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
<style>
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
  background: var(--tg-theme-bg-color);
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
