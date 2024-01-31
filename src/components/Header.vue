<script setup lang="ts">
import { computed } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { useRouter, useRoute } from 'vue-router'
const auth0 = useAuth0()

const route = useRoute()
const isLoading = computed(() => auth0.isLoading)
const user = computed(() => auth0.user)
const login = () => {
  auth0.loginWithRedirect({
    appState: { target: route.fullPath },
  })
}
const logout = () => {
  auth0.logout({
    logoutParams: {
      returnTo: window.location.origin,
    },
  })
}
</script>
<template>
  <header>
    <div id="header-content">
      <div id="header-left">
        <slot name="left">
          <RouterLink to="/"><span>Розклад</span></RouterLink>
        </slot>
      </div>
      <div id="header-center">
        <slot></slot>
      </div>
      <div id="header-right">
        <slot name="right" v-if="!auth0.isAuthenticated.value">
          <button id="header-auth-btn" @click="login">
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
              class="lucide lucide-log-in"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" x2="3" y1="12" y2="12" />
            </svg>
            <span>Авторизація</span>
          </button>
        </slot>
        <slot name="right" v-else>
          <button id="header-settings-btn" @click="logout">
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
              class="lucide lucide-settings"
            >
              <path
                d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
              />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Вийти</span>
          </button>
          <!-- <RouterLink to="/settings">
            <button id="header-settings-btn">
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
                class="lucide lucide-settings"
              >
                <path
                  d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
                />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Налаштування</span>
            </button>
          </RouterLink> -->
        </slot>
      </div>
    </div>
  </header>
</template>
<style>
header {
  width: 100%;
  height: 72px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: sticky;
  top: 0;
  background-color: #fff;
}
#header-content {
  width: 100%;
  max-width: 1600px;
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
}
#header-left,
#header-middle,
#header-right {
  width: 100%;
  display: flex;
}
#header-middle {
  justify-content: center;
}
#header-right {
  justify-content: flex-end;
}
#header-name {
  color: #081236;
  font-family: 'M PLUS Rounded 1c Medium';
  font-size: 24px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
}
@media screen and (max-width: 810px) {
  #header-auth-btn span {
    display: none;
  }
  #header-content {
    padding: 16px;
  }
}
@media screen and (max-width: 360px) {
  #header-left {
    display: none;
  }
}
</style>
