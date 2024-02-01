<script setup lang="ts">
defineProps({
  checked: {
    type: Boolean,
    default: undefined,
  },
  modelValue: {
    type: Boolean,
    default: undefined,
  },
  id: {
    type: String,
    default: 'switch',
  },
  name: {
    type: String,
    default: 'switch',
  },
})
const emit = defineEmits<{
  (eventName: 'update:modelValue', data: boolean): void
  (eventName: 'change', data: boolean): void
}>()
const emitUpdate = (e: Event) => {
  const value = (e.target as HTMLInputElement).checked
  emit('update:modelValue', value)
  emit('change', value)
}
</script>
<template>
  <input
    :checked="checked"
    type="checkbox"
    :id="id"
    :name="name"
    @change="emitUpdate($event)"
  /><label :for="id">Toggle</label>
</template>
<style scoped>
input[type='checkbox'] {
  height: 0;
  width: 0;
  visibility: hidden;
}

label {
  cursor: pointer;
  text-indent: -9999px;
  width: 36px;
  height: 18px;
  background: grey;
  display: block;
  border-radius: 18px;
  position: relative;
}

label:after {
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 16px;
  transition: 0.3s;
}

input:checked + label {
  background: #bada55;
}

input:checked + label:after {
  left: calc(100% - 1px);
  transform: translateX(-100%);
}

label:active:after {
  width: 12px;
}
</style>
