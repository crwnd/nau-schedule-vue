<script setup lang="ts">
import Header from '@/components/Header.vue'
import { useRoute, useRouter } from 'vue-router'
import { useGroupsStore } from '@/stores/groups'
const groupsStore = useGroupsStore()
const route = useRoute()
const router = useRouter()
</script>
<template>
  <div>
    <Header>
      <!-- <template #default>
        <div id="header-group-select">
          <select
            v-if="groupsStore.groups?.length"
            :value="route.params.group_code"
            @change="
              (e: Event) =>
                router.push(`/${(e.target as HTMLSelectElement)?.value}`)
            "
          >
            <option
              v-for="group in groupsStore.groups"
              :key="group.code"
              :value="group.code"
            >
              {{ group.names[0] }}
            </option>
          </select>
        </div>
      </template> -->
    </Header>
    <main>
      <div id="main-content">
        <div id="group-select-page">
          <h1>Оберіть групу</h1>
          <ul class="group-select__list">
            <li
              v-for="group in groupsStore.groups"
              :key="group.code"
              class="group-select__group"
            >
              <router-link
                :to="`/${group.code}`"
                class="group-select__group__link"
              >
                {{ group.names[0] }}
              </router-link>
            </li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</template>
<style scoped>
.group-select__list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  list-style: none;
  padding: 0;
  margin: 0;
  gap: 8px;
}
.group-select__group {
  width: 100%;
  max-width: 350px;
  height: 40px;
  background: #e0e9fe;
  border-radius: 11.2px;
}
.group-select__group__link {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
