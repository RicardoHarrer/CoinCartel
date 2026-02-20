import { createRouter, createWebHistory } from 'vue-router';
import { LoadingBar } from 'quasar';
import { auth } from '@/utils/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true,
        hideNavbar: true
      },
    },
    {
      path: '/register',
      name: 'registerPage',
      component: () => import('../views/RegistrationView.vue'),
      meta: { requiresGuest: true ,
        hideNavbar:true
      },
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
      path: '/market',
      name: 'Market',
      component: () => import('@/views/CryptoChartView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/crypto',
      redirect: '/market',
    },
    {
      path: '/paper-trading',
      name: 'PaperTrading',
      component: () => import('@/views/PaperTradingView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/goals',
      name: 'goals',
      component: () => import('../views/GoalsView.vue'),
    },
    {
      path: '/datenschutz',
      name: 'privacyPolicy',
      component: () => import('@/views/PrivacyPolicyView.vue'),
    },
    {
      path: '/agb',
      name: 'termsAndConditions',
      component: () => import('@/views/TermsView.vue'),
    },
    {
      path: '/bank-import',
      redirect: '/settings',
    },
  ],
});

router.beforeEach((to, from, next) => {
  LoadingBar.start();
  const isAuth = auth.isAuthenticated();

  if (to.meta.requiresAuth && !isAuth) {
    return next('/login');
  }

  if (to.meta.requiresGuest && isAuth) {
    return next('/');
  }

  next();
});

router.afterEach(() => {
  LoadingBar.stop();
});

export default router;
