<template>
  <div id="nav">
    <router-link to="/dashboard">Дашборд</router-link> |
    <router-link to="/statistics">Статистика</router-link>
  </div>

  <router-view />
</template>

<style>
/* глобальні стилі */
body {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  padding: 20px;
}
#nav {
  padding-bottom: 20px;
}
#nav a {
  font-weight: bold;
  color: #2c3e50;
}
#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
