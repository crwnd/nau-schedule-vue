import './assets/normalize.css'
import './assets/main.css'
// import '/src/js/telegram-web-app.js'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
// import VueTelegram from "vue-tg"
import { createAuth0 } from "@auth0/auth0-vue"

import App from './App.vue'
import router from './router'

import LessonView from './modals/LessonView.vue'
import LessonForm from './modals/LessonForm.vue'
import LessonChangeForm from './modals/LessonChangeForm.vue'
import SwitchInput from './components/SwitchInput.vue'

const app = createApp(App)
app.use(createPinia())
app.use(router)
// app.use(VueTelegram)

app.use(
    createAuth0({
        domain: import.meta.env.VITE_AUTH0_DOMAIN,
        clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
        authorizationParams: {
            redirect_uri: window.location.origin,
            audience: "nau-schedule-api",
            scope: "openid read:lessons write:lessons delete:lessons read:templates write:templates"
        },
        cacheLocation: 'localstorage',
    })
)

app.component('LessonView', LessonView)
app.component('LessonForm', LessonForm)
app.component('LessonChangeForm', LessonChangeForm)
app.component('SwitchInput', SwitchInput)

app.mount('#app')
