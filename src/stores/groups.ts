import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
// import { useWebApp } from 'vue-tg'
import type { TGroup } from '@/utils/types'


export const useGroupsStore = defineStore('groups', () => {
    // const tgUser = useWebApp()
    const fallbackData = ref<{ data: TGroup[], lastSync: number }>({ data: [], lastSync: -1 })
    const userData = ref<TGroup[]>()
    const isLoading = ref(false)
    const groups = computed((): TGroup[] => {
        if (isLoading.value) {
            return fallbackData.value.data
        }
        if (!userData.value) {
            return fallbackData.value.data
        }
        return userData.value
    })

    async function updateGroups(showLoading = true) {
        console.log('updateGroups')
        if (isLoading.value) { return }
        if (showLoading) isLoading.value = true
        try {
            const resp = await (
                await fetch(`${import.meta.env.VITE_API_URL}/groups/`, {
                    method: 'GET',
                    // headers: { 'Content-Type': 'application/json' },
                    // body: JSON.stringify({ init_data: tgUser.initData })
                    // body: JSON.stringify({ init_data: null })
                })
            ).json()
            userData.value = resp.groups
            fallbackData.value = { data: resp.groups, lastSync: Math.floor(new Date().valueOf() / 1000) }
            localStorage.setItem('groups', JSON.stringify({ data: resp.groups, lastSync: Math.floor(new Date().valueOf() / 1000) }))
        } catch { console.log('groups query failed') } finally { if (showLoading) isLoading.value = false }
    }

    async function init() {
        const localStorageGroupsJSON = localStorage.getItem('groups')
        if (localStorageGroupsJSON) {
            fallbackData.value = JSON.parse(localStorageGroupsJSON)
        }
        isLoading.value = false
        if (!fallbackData.value.data?.length) {
            await updateGroups()
        } else {
            if (Math.floor(new Date().valueOf() / 1000) - fallbackData.value.lastSync >= 5 * 60)
                updateGroups(false)
        }
    }

    async function refresh() {
        await updateGroups()
    }

    return { groups, init, updateGroups, refresh }
})
