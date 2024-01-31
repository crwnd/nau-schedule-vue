import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuth0 } from '@auth0/auth0-vue'
// import { useWebApp } from 'vue-tg'

export const useUserStore = defineStore('user', () => {
    const auth0 = useAuth0()
    const user = ref({
        permissions: [] as string[],
    })
    const isLoading = ref(false)

    async function init() {
        if (auth0.isAuthenticated.value) return
        if (isLoading.value) { return }
        isLoading.value = true
        try {
            const resp = await (
                await fetch(`${import.meta.env.VITE_API_URL}/users/lookup`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await auth0.getAccessTokenSilently()}` },
                })
            ).json()
            if (!resp.error) {
                user.value = resp
            }
        } catch { console.log('user query failed') } finally { isLoading.value = false }
    }

    return { user, init }
})

// const tgUser = useWebApp()

// export enum TUserPermissions {
//     user = 'user',
//     admin = 'admin',
//     root = 'root',
// };
// export type TUser = {
//     code: string,
//     name: string,
//     surname: string,
//     patronymic: string,
//     desc: string,
//     telegram_ids: Array<bigint>,
//     account_flags: TUserPermissions[]
// }

// export const useUserStore = defineStore('user', () => {
//     const fallbackData = ref<TUser>()
//     const userData = ref<TUser>()
//     const isLoading = ref(false)
//     const user = computed((): TUser | undefined => {
//         if (isLoading.value) {
//             return undefined
//         }
//         if (!userData.value) {
//             return undefined
//         }
//         return userData.value
//     })

//     async function checkAuth(showLoading = true) {
//         if (isLoading.value) { return }
//         if (showLoading) isLoading.value = true
//         try {
//             const resp = await (
//                 await fetch(`${import.meta.env.VITE_API_URL}/users/lookup`, {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({ init_data: tgUser.initData })
//                 })
//             ).json()
//             if (!resp.error) {
//                 userData.value = resp
//                 localStorage.setItem('user', JSON.stringify({ data: resp, lastSync: Math.floor(new Date().valueOf() / 1000) }))
//             }
//         } catch { console.log('user query failed') } finally { if (showLoading) isLoading.value = false }
//     }

//     async function init() {
//         const localStorageGroupsJSON = localStorage.getItem('user')
//         if (localStorageGroupsJSON) {
//             const localStorageGroups = JSON.parse(localStorageGroupsJSON)
//             if (Math.floor(new Date().valueOf() / 1000) - localStorageGroups.lastSync >= 5 * 60)
//                 fallbackData.value = localStorageGroups.data
//         }
//         isLoading.value = false
//         checkAuth()
//     }

//     return { user, init, checkAuth }
// })
