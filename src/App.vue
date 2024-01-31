<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
// import { BackButton } from 'vue-tg'
import { useGroupsStore } from './stores/groups'
import { onMounted } from 'vue'
import { useUserStore } from './stores/user'
const router = useRouter()
const groupsStore = useGroupsStore()
const userStore = useUserStore()

// const { showAlert } = useWebAppPopup()
onMounted(async () => {
  await userStore.init()
  await groupsStore.init()
})
</script>

<template>
  <!-- <BackButton
    :visible="!!router.options.history.state.back"
    @click="router.back()"
  /> -->
  <!-- <button @click="() => showAlert('Hello!')">Open alert</button> -->
  <RouterView />
  <!-- <button @click="() => groupsStore.refresh()">Refresh groups</button> -->
</template>

<style scoped>
#header-group-select {
  width: 100%;
  max-width: 350px;
  -moz-user-select: -moz-none;
  -ms-user-select: none;
  -webkit-user-select: none;
  user-select: none;
  background: #e0e9fe;
  overflow: hidden;
  border: none;
  border-radius: 3px;
  box-shadow: none;
  -moz-transition: box-shadow 0.2s;
  -o-transition: box-shadow 0.2s;
  -webkit-transition: box-shadow 0.2s;
  transition: box-shadow 0.2s;
  border-radius: 11.2px;
  position: relative;
}
#header-group-select:focus,
#header-group-select:hover {
  /* box-shadow: 0 0 15px rgba(0, 0, 0, 0.2); */
}
/*
#header-group-select:after {
  content: '▾';
  position: absolute;
  top: 0;
  right: 12px;
  z-index: 1;
  color: #081236;
  line-height: 40px;
  font-size: 14px;
}*/
.ie .form-select:after {
  display: none;
}

#header-group-select select {
  position: relative;
  background: transparent;
  background-image: none;
  display: block;
  width: 100%;
  outline: none;
  color: #081236;
  cursor: pointer;
  z-index: 2;
  border: none;
  padding: 10px 10px 10px 5px;
  text-overflow: '';
  text-indent: 5px;
  text-align: center;
}
#header-group-select select[multiple='multiple'] {
  height: auto;
  border: 1px solid #cbcbcb;
  border-radius: 3px;
  box-shadow:
    0 0 1px rgba(0, 0, 0, 0.1),
    inset 0 0 10px rgba(0, 0, 0, 0.07);
  -moz-transition: box-shadow 0.2s;
  -o-transition: box-shadow 0.2s;
  -webkit-transition: box-shadow 0.2s;
  transition: box-shadow 0.2s;
}
#header-group-select select[multiple='multiple']:hover {
  border-color: #cccccc;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
}
#header-group-select select option[disabled] {
  color: #eeeeee;
  text-shadow: none;
  border: none;
}

select:-moz-focusring {
  color: transparent;
  text-shadow: 0 0 0 #888888;
}

select::-ms-expand {
  display: none;
}
</style>
