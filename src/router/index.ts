import { createRouter, createWebHistory } from 'vue-router'
import SingleGroupSchedule from '@/pages/SingleGroupSchedule.vue'
import settingsPage from '@/pages/SettingsPage.vue'
import groupSelectPage from '@/pages/GroupSelect.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: groupSelectPage,
    },
    {
      path: '/settings',
      name: 'settings',
      component: settingsPage
    },
    {
      path: '/:group_code/:year/:month/:day/:action?/:actionParam?',
      name: 'day-group-schedule',
      component: SingleGroupSchedule
    },
    {
      path: '/:group_code',
      name: 'group-schedule',
      redirect: to => {
        const date = new Date()
        return { path: `/${to.params.group_code}/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}` }
      }
    }
  ]
})

export default router
