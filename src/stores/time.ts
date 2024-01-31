import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useScheduleStore = defineStore('time', () => {
    const timestamp = ref(0)
    function update() {
        new Date().valueOf()
    }

    return { timestamp, update }
})
