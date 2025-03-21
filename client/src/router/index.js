import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'registerPage',
      component: () => import('../views/RegistrationView.vue'),
    },
    {
      path: '/chart',
      name: 'chartPage',
      component: () => import('../views/ChartView.vue'),
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    }
  ],
});

export default router;
