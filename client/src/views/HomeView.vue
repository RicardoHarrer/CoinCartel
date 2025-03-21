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