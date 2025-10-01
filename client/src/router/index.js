import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '@/utils/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/register',
      name: 'registerPage',
      component: () => import('../views/RegistrationView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/chart',
      name: 'chartPage',
      component: () => import('../views/ChartView.vue'),
      meta: { requiresAuth: true },
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
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/SettingsPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/crypto',
      name: 'Crypto',
      component: () => import('@/views/CryptoChartView.vue'),
      meta: { requiresAuth: true },
    },
    // ADD THIS NEW ROUTE:
    {
      path: '/bank-import',
      name: 'BankImport',
      component: () => import('@/views/BankImportView.vue'),
      meta: { requiresAuth: true },
    },
  ],
});

// Rest of your router configuration remains the same...
router.beforeEach((to, from, next) => {
  const isAuth = auth.isAuthenticated();

  if (to.meta.requiresAuth && !isAuth) {
    return next('/login');
  }

  if (to.meta.requiresGuest && isAuth) {
    return next('/');
  }

  next();
});

export default router;
