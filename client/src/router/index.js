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
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/transactions',
      name: 'Transactions',
      component: () => import('@/views/TransactionsView.vue'),
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/SettingsPage.vue'),
    },
  ],
});

export default router;
