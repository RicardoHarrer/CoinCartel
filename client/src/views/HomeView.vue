<!--
<script>
import { useRouter } from 'vue-router';

export default {
  setup() {
    const router = useRouter();

    const navigateToRegistry = () => {
      router.push('/register');
    };

    return {
      navigateToRegistry,
    };
  },
};
</script>

<template>
  <div class="homepage">
    <div class="hero-section bg-primary text-white text-center q-pa-lg">
      <div class="text-h2 q-mb-md">Welcome to Your Financial Tracker</div>
      <div class="text-h6 q-mb-lg">
        Track your income, expenses, and financial health with ease.
      </div>
    </div>

    <div class="features-section q-px-xl q-pt-xl q-pb-lg">
      <div class="row q-col-gutter-md justify-center">
        <div class="col-12 col-md-4">
          <q-card class="feature-card text-center">
            <q-icon name="show_chart" size="xl" color="primary" class="q-mb-md" />
            <div class="text-h6 q-mb-sm">Visualize Your Finances</div>
            <div class="text-body1">
              Get a clear overview of your income and expenses with interactive charts.
            </div>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="feature-card text-center">
            <q-icon name="trending_up" size="xl" color="primary" class="q-mb-md" />
            <div class="text-h6 q-mb-sm">Track Trends</div>
            <div class="text-body1">
              Monitor your financial trends over time and make informed decisions.
            </div>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="feature-card text-center">
            <q-icon name="security" size="xl" color="primary" class="q-mb-md" />
            <div class="text-h6 q-mb-sm">Secure & Private</div>
            <div class="text-body1">
              Your data is safe with us. We prioritize your privacy and security.
            </div>
          </q-card>
        </div>
      </div>
    </div>

    <div
      :class="['cta-section', 'text-center', 'q-px-xl', 'q-pb-xl', $q.dark.isActive ? 'bg-dark' : 'bg-grey-3']"
    >
      <div :class="['text-h4', 'q-mb-md', $q.dark.isActive ? 'text-white' : 'text-dark']">
        Ready to Take Control of Your Finances?
      </div>
      <q-btn
        label="Get Started"
        :color="$q.dark.isActive ? 'secondary' : 'primary'"
        size="lg"
        @click="navigateToRegistry"
      />
    </div>
  </div>
</template>

<style scoped>
.homepage {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.hero-section {
  padding: 100px 20px;
}

.features-section {
  flex: 1;
  padding-bottom: 40px;
}

.feature-card {
  padding: 20px;
  height: 100%;
}

.cta-section {
  padding-top: 40px;
  padding-bottom: 60px;
}
</style>
-->
<template>
  <q-page class="homepage">
    <!-- Hero Section -->
    <section class="hero-section text-center q-pa-xl">
      <div class="hero-content">
        <h1 class="hero-title text-h2 text-weight-bold q-mb-md">
          Take Control of Your Finances
        </h1>
        <p class="hero-subtitle text-h5 q-mb-xl">
          Powerful tools to track, analyze and optimize your financial health
        </p>
      </div>
    </section>

    <!-- Stats Section -->
    <q-card flat class="stats-section q-pa-xl">
      <div class="row justify-around items-center text-center">
        <div v-for="stat in stats" :key="stat.value" class="col-6 col-md-3 q-pa-md">
          <div class="stat-value text-h3 text-weight-bold">{{ stat.value }}</div>
          <div class="stat-label text-subtitle1">{{ stat.label }}</div>
        </div>
      </div>
    </q-card>

    <!-- Features Section -->
    <section class="features-section q-px-xl q-pt-xl q-pb-lg">
      <h2 class="section-title text-h4 text-center text-weight-bold q-mb-xl">Why Choose Our Financial Tracker</h2>

      <div class="row q-col-gutter-xl">
        <div v-for="(feature) in features" :key="feature.title" class="col-12 col-md-6">
          <q-card flat class="feature-card">
            <div class="column items-center q-pa-lg">
              <q-icon :name="feature.icon" size="xl" color="primary" class="q-mb-md" />
              <h3 class="feature-title text-h5 text-weight-bold q-mb-sm">{{ feature.title }}</h3>
              <p class="feature-description text-body1 text-center">{{ feature.description }}</p>
              <q-img
                :src="feature.image"
                :alt="feature.title"
                class="q-mt-md"
                style="max-height: 200px"
              />
            </div>
          </q-card>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="final-cta text-center q-px-xl q-py-xl">
      <h2 class="cta-title text-h3 text-weight-bold q-mb-md">Ready to Transform Your Financial Life?</h2>
      <q-btn
        label="Get Started for free"
        color="white"
        text-color="primary"
        size="lg"
        @click="navigateToRegistry"
      />
      <p class="cta-subtitle q-mt-md text-caption">No credit card required · Cancel anytime</p>
    </section>
  </q-page>
</template>

<script>
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

export default {
  setup() {
    const router = useRouter();
    const $q = useQuasar();

    const navigateToRegistry = () => {
      router.push('/register');
    };

    const stats = [
      { value: '100%', label: 'Open Source' },
      { value: '24/7', label: 'Available' },
      { value: '0€', label: 'Free' },
      { value: 'A+', label: 'Security' }
    ];

    const features = [
      {
        title: 'Financial Dashboard',
        description: 'Clear overview of your income and expenses with interactive charts.',
        icon: 'insights',
        image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
      },
      {
        title: 'Trend Analysis',
        description: 'Monitor financial patterns and get personalized recommendations.',
        icon: 'trending_up',
        image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
      },
      {
        title: 'Smart Budgeting',
        description: 'Intuitive tools to help you achieve your financial goals faster.',
        icon: 'account_balance_wallet',
        image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
      },
      {
        title: 'Data Security',
        description: 'Military-grade encryption to keep your financial data private.',
        icon: 'lock',
        image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
      }
    ];

    return {
      navigateToRegistry,
      stats,
      features,
      darkMode: $q.dark.isActive
    };
  }
};
</script>

<style lang="scss" scoped>
.homepage {
  .hero-section {
    padding: 120px 20px;
    background: white;

    @media (min-width: $breakpoint-md-min) {
      padding: 160px 20px;
    }
  }

  .stats-section {
    border-radius: 0;
    border-top: 1px solid rgba(0,0,0,0.1);
    border-bottom: 1px solid rgba(0,0,0,0.1);
    background: rgba(245, 245, 245, 0.8);
  }

  .feature-card {
    border-radius: 12px;
    transition: all 0.3s ease;
    border: 1px solid rgba(0,0,0,0.1);
    background: white;

    &:hover {
      transform: translateY(-5px);
      box-shadow: $shadow-4;
    }
  }

  .final-cta {
    background: linear-gradient(135deg, $primary 0%, darken($primary, 10%) 100%);
  }

  /* Dark mode adjustments */
  body.body--dark & {
    .hero-section {
      background: $dark;
    }

    .hero-title,
    .section-title,
    .feature-title,
    .cta-title {
      color: white !important;
    }

    .hero-subtitle,
    .stat-label,
    .feature-description,
    .cta-subtitle {
      color: rgba(255, 255, 255, 0.8) !important;
    }

    .stat-value {
      color: $primary !important;
    }

    .stats-section {
      background: rgba(30, 30, 30, 0.5) !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
    }

    .feature-card {
      background: $dark-page;
      border-color: rgba(255, 255, 255, 0.1) !important;
    }
  }
}
</style>