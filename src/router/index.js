import { createRouter, createWebHistory } from "vue-router";

import DashboardView from "../views/DashboardView.vue";

const routes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    component: DashboardView,
  },
  {
    path: "/statistics",
    name: "Statistics",

    component: () => import("../views/StatisticsView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
