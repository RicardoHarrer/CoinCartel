<template>
  <q-page class="homepage">
    <div class="dark-mode-toggle">
      <q-btn
        round
        :color="$q.dark.isActive ? 'grey-9' : 'yellow-9'"
        :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'"
        class="toggle-btn"
        @click="toggleDarkMode"
        size="lg"
      />
    </div>

    <section class="hero-section text-center q-pa-xl">
      <div class="hero-background"></div>
      <div class="hero-content">
        <h1 class="hero-title text-h2 text-weight-bold q-mb-md animate__animated animate__fadeInDown">
          <template v-if="isLoggedIn">
            Welcome back to your <span class="text-gradient">Finance Hub</span>
          </template>
          <template v-else>
            Take Control of Your <span class="text-gradient">Finances</span>
          </template>
        </h1>
        <p class="hero-subtitle text-h5 q-mb-xl animate__animated animate__fadeIn animate__delay-1s">
          <template v-if="isLoggedIn">
            Continue where you left off and jump directly into your analytics.
          </template>
          <template v-else>
            Powerful tools to track, analyze and optimize your financial health
          </template>
        </p>
        <q-btn
          :label="isLoggedIn ? 'Open Dashboard' : 'Get Started'"
          color="white"
          text-color="primary"
          size="lg"
          class="animate__animated animate__fadeInUp animate__delay-1s hero-btn"
          @click="navigatePrimary"
        />
      </div>
    </section>

    <q-card flat class="stats-section q-pa-xl">
      <div class="row justify-around items-center text-center">
        <div v-for="stat in stats" :key="stat.value" class="col-6 col-md-3 q-pa-md">
          <div
            class="stat-value text-h3 text-weight-bold"
            :data-target="stat.value.replace('%', '').replace('€', '')"
          >
            {{ stat.initialValue }}
          </div>
          <div class="stat-label text-subtitle1">{{ stat.label }}</div>
        </div>
      </div>
    </q-card>

    <section class="features-section q-px-xl q-pt-xl q-pb-lg">
      <h2 class="section-title text-h4 text-center text-weight-bold q-mb-xl animate__animated animate__fadeIn">
        Why Choose Our Financial Tracker
      </h2>

      <div class="carousel-wrapper">
        <q-carousel
          v-model="slide"
          animated
          infinite
          autoplay
          :autoplay-interval="4000"
          height="500px"
          class="feature-carousel"
          arrows
          control-type="flat"
          control-color="primary"
          control-text-color="white"
        >
          <q-carousel-slide
            v-for="(feature, index) in features"
            :key="feature.title"
            :name="index"
            class="column flex-center"
          >
            <div class="slide-clipper">
              <div class="row items-center full-height carousel-slide-content">
                <div class="col-12 col-md-6 carousel-col">
                  <div
                    class="feature-content animate__animated"
                    :class="{ animate__fadeInLeft: slide === index }"
                  >
                    <q-icon :name="feature.icon" size="xl" color="primary" class="q-mb-md" />
                    <h3 class="feature-title text-h3 text-weight-bold q-mb-sm">
                      {{ feature.title }}
                    </h3>
                    <p class="feature-description text-body1">
                      {{ feature.description }}
                    </p>
                    <q-btn
                      :label="isLoggedIn ? 'Open Dashboard' : 'Learn more'"
                      color="primary"
                      flat
                      class="q-mt-md feature-btn"
                      @click="navigatePrimary"
                    />
                  </div>
                </div>

                <div class="col-12 col-md-6 carousel-col">
                  <div class="image-container">
                    <q-img
                      :src="feature.image"
                      :alt="feature.title"
                      class="feature-image animate__animated"
                      :class="{ animate__zoomIn: slide === index }"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>
          </q-carousel-slide>
        </q-carousel>

        <div class="custom-carousel-controls">
          <q-btn round icon="chevron_left" @click="previousSlide" class="control-btn" size="md" />
          <div class="slide-indicators">
            <q-btn
              v-for="(feature, index) in features"
              :key="index"
              round
              :color="slide === index ? 'primary' : 'grey-4'"
              size="8px"
              @click="slide = index"
              class="indicator-btn"
            />
          </div>
          <q-btn round icon="chevron_right" @click="nextSlide" class="control-btn" size="md" />
        </div>
      </div>
    </section>

    <section class="interactive-features q-px-xl q-py-xl">
      <h2 class="section-title text-h4 text-center text-weight-bold q-mb-xl">
        Smart Financial Features
      </h2>

      <div class="features-grid">
        <div
          v-for="(feature, index) in interactiveFeatures"
          :key="feature.title"
          class="feature-card"
          @mouseenter="hoveredFeature = index"
          @mouseleave="hoveredFeature = null"
        >
          <div class="feature-icon" :class="{ 'feature-icon-hovered': hoveredFeature === index }">
            <q-icon :name="feature.icon" size="32px" />
          </div>
          <h4 class="feature-card-title">{{ feature.title }}</h4>
          <p class="feature-card-description text-lighter">{{ feature.description }}</p>
          <div class="feature-highlight" :class="{ 'feature-highlight-active': hoveredFeature === index }"></div>
        </div>
      </div>
    </section>

    <section v-if="!isLoggedIn" class="final-cta text-center q-px-xl q-py-xl">
      <div class="cta-content animate__animated animate__pulse animate__infinite animate__slower">
        <h2 class="cta-title text-h3 text-weight-bold q-mb-md">
          Ready to Transform Your Financial Life?
        </h2>
        <q-btn
          :label="isLoggedIn ? 'Go to Dashboard' : 'Get Started for free'"
          color="white"
          text-color="primary"
          size="lg"
          class="cta-button"
          @click="navigatePrimary"
        />
        <p class="cta-subtitle q-mt-md text-caption">
          {{ isLoggedIn ? "You are currently signed in." : "No credit card required · Cancel anytime" }}
        </p>
      </div>
    </section>
  </q-page>
</template>

<script>
import { useRoute, useRouter } from "vue-router";
import { useQuasar, QCarousel, QCarouselSlide } from "quasar";
import { onMounted, ref, watch } from "vue";
import "animate.css";
import { auth } from "@/utils/auth";

export default {
  components: { QCarousel, QCarouselSlide },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const $q = useQuasar();

    const slide = ref(0);
    const hoveredFeature = ref(null);
    const isLoggedIn = ref(false);

    const syncAuthState = () => {
      isLoggedIn.value = auth.isAuthenticated();
    };

    const navigatePrimary = () => {
      router.push(auth.isAuthenticated() ? "/chart" : "/register");
    };

    const toggleDarkMode = () => {
      $q.dark.set(!$q.dark.isActive);

      document.documentElement.style.transition = "background-color 0.5s ease, color 0.5s ease";
      setTimeout(() => (document.documentElement.style.transition = ""), 500);
    };

    const stats = [
      { value: "100%", initialValue: "100%", label: "Open Source" },
      { value: "24/7", initialValue: "24/7", label: "Available" },
      { value: "0€", initialValue: "0€", label: "Costs" },
      { value: "A+", initialValue: "A+", label: "Security" },
    ];

    const features = [
      {
        title: "Financial Dashboard",
        description:
          "Get a crystal-clear overview of your income and expenses with our interactive, real-time dashboard. Visualize your cash flow with beautiful charts and customizable widgets that help you understand your finances at a glance.",
        icon: "insights",
        image:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      },
      {
        title: "Trend Analysis",
        description:
          "Our AI-powered analysis detects spending patterns and provides personalized recommendations. Set financial goals and let our system guide you with actionable insights to improve your financial health.",
        icon: "trending_up",
        image:
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      },
      {
        title: "Smart Budgeting",
        description:
          "Create budgets that actually work. Our intelligent system learns from your spending habits and automatically adjusts your budgets. Get notified before you overspend and celebrate when you save!",
        icon: "account_balance_wallet",
        image:
          "https://images.unsplash.com/photo-1579621970795-87facc2f976d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      },
      {
        title: "Data Security",
        description:
          "Your financial data is protected with bank-level security. We use end-to-end encryption and never store your banking credentials. Sleep well knowing your information is always safe with us.",
        icon: "lock",
        image:
          "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      },
    ];

    const interactiveFeatures = [
      { title: "Real-time Analytics", description: "Live tracking of your financial metrics with instant updates", icon: "analytics" },
      { title: "Smart Alerts", description: "Get notified about unusual spending and budget limits", icon: "notifications" },
      { title: "Goal Tracking", description: "Set and monitor your financial goals with progress tracking", icon: "flag" },
      { title: "Multi-Currency", description: "Support for multiple currencies with automatic conversion", icon: "currency_exchange" },
      { title: "Export Reports", description: "Generate detailed financial reports in multiple formats", icon: "description" },
      { title: "Mobile Sync", description: "Access your data anywhere with seamless mobile synchronization", icon: "smartphone" },
    ];

    const nextSlide = () => {
      slide.value = (slide.value + 1) % features.length;
    };

    const previousSlide = () => {
      slide.value = (slide.value - 1 + features.length) % features.length;
    };

    onMounted(() => {
      syncAuthState();
      const counters = document.querySelectorAll(".stat-value");
      const speed = 200;

      counters.forEach((counter) => {
        const rawTarget = counter.getAttribute("data-target");
        const target = Number(rawTarget);

        if (!Number.isFinite(target)) return; // e.g. "24/7" or "A+" -> skip

        const increment = target / speed;

        const updateCount = () => {
          const current = Number(counter.innerText.replace("%", "").replace("€", ""));
          if (!Number.isFinite(current)) return;

          if (current < target) {
            const next = Math.min(target, Math.ceil(current + increment));
            const initial = counter.innerText;
            const hasPercent = initial.includes("%");
            const hasEuro = initial.includes("€");

            counter.innerText = hasPercent ? `${next}%` : hasEuro ? `${next}€` : `${next}`;
            setTimeout(updateCount, 12);
          }
        };

        updateCount();
      });
    });

    watch(
      () => route.fullPath,
      () => {
        syncAuthState();
      }
    );

    return {
      navigatePrimary,
      toggleDarkMode,
      stats,
      features,
      interactiveFeatures,
      isLoggedIn,
      slide,
      hoveredFeature,
      nextSlide,
      previousSlide,
    };
  },
};
</script>

<style lang="scss" scoped>

.homepage {
  overflow-x: hidden;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
}

.homepage {
  background: #f8f9fa;
  min-height: 100vh;
  transition: all 0.5s ease;
}

.dark-mode-toggle {
  position: fixed;
  bottom: 24px;
  left: 24px;
  z-index: 1000;
}

.toggle-btn {
  width: 60px;
  height: 60px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 3px solid white !important;
  backdrop-filter: blur(10px);

  background: #ffd600 !important;
  color: #f5f5f5 !important;

  &:hover {
    transform: scale(1.1) rotate(12deg);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
    border-color: #f5f5f5 !important;
  }

  &:active {
    transform: scale(0.95);
  }
}

.hero-section {
  position: relative;
  padding: 120px 20px;
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;

  .hero-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    z-index: -1;

    &::before {
      content: "";
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
      animation: pulse 15s infinite alternate;
    }

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="white" opacity=".25"/><path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" fill="white" opacity=".5"/><path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="white"/></svg>');
      background-repeat: no-repeat;
      background-position: bottom;
      background-size: cover;
    }
  }

  .hero-content {
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
  }

  .hero-btn {
    border-radius: 12px;
    font-weight: 600;
    padding: 16px 40px;
    border: none !important;
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%) !important;
    color: white !important;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 8px 25px rgba(25, 118, 210, 0.3);

    &:hover {
      background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%) !important;
      transform: translateY(-3px);
      box-shadow: 0 12px 35px rgba(25, 118, 210, 0.4);
    }
  }
}

.text-gradient {
  background: linear-gradient(135deg, #1976d2 0%, #42a5f5 50%, #90caf9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: inline-block;
  background-size: 200% 200%;
  animation: gradientShift 3s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.stats-section {
  border-radius: 0;
  background: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  margin-top: -50px;
  position: relative;
  z-index: 1;
  border: 2px solid #dee2e6 !important;
  width: 100%;
  box-sizing: border-box;

  .stat-value {
    color: #1976d2;
    font-size: 3rem;
    margin-bottom: 10px;
  }

  .stat-label {
    color: #6c757d;
    font-weight: 500;
  }
}

.features-section {
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.carousel-wrapper {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  overflow: visible;
  border-radius: 20px;
}

.slide-clipper {
  width: 100%;
  overflow: hidden;
}

.carousel-slide-content {
  width: 100%;
  margin: 0 !important;
  box-sizing: border-box;
}

.carousel-col {
  padding: 0 20px;
  min-width: 0;
  box-sizing: border-box;
}

.feature-carousel {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 2px solid #dee2e6 !important;
  width: 100%;
  max-width: 100%;

  :deep(.q-carousel__slide) {
    overflow: hidden;
  }

  .feature-content {
    padding: 40px;

    .feature-title {
      line-height: 1.2;
      margin-bottom: 20px;
    }

    .feature-description {
      color: #6c757d;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .feature-btn {
      border: none !important;
      background: rgba(25, 118, 210, 0.1) !important;
      color: #1976d2 !important;
      border-radius: 8px;
      padding: 10px 24px;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(25, 118, 210, 0.2) !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(25, 118, 210, 0.2);
      }
    }
  }

  .image-container {
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    box-sizing: border-box;

    overflow: hidden;
    min-width: 0;
  }

  .feature-image {
    border-radius: 16px;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
    height: 360px;
    width: 100%;
    max-width: 500px;
    object-fit: cover;
    transition: all 0.5s ease;

    min-width: 0;
  }
}

.custom-carousel-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
  padding-bottom: 10px;
  width: 100%;

  .control-btn {
    background: white !important;
    color: #1976d2 !important;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }
  }

  .slide-indicators {
    display: flex;
    gap: 8px;

    .indicator-btn {
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.2);
      }
    }
  }
}

.interactive-features {
  width: 100%;
  box-sizing: border-box;

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .feature-card {
    position: relative;
    padding: 32px 24px;
    background: white;
    border-radius: 16px;
    border: 2px solid #e9ecef;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    overflow: hidden;
    width: 100%;
    box-sizing: border-box;

    &:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      border-color: #1976d2;
    }

    .feature-icon {
      width: 70px;
      height: 70px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(66, 165, 245, 0.1) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      transition: all 0.4s ease;
      color: #1976d2;
    }

    .feature-icon-hovered {
      background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
      color: white;
      transform: scale(1.1) rotate(5deg);
    }

    .feature-card-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 12px;
      color: #2d3748;
    }

    .feature-card-description {
      color: #8e99a5 !important;
      line-height: 1.5;
      font-size: 0.95rem;
    }

    .text-lighter {
      color: #8e99a5 !important;
    }

    .feature-highlight {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 0;
      height: 4px;
      background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
      transition: width 0.4s ease;
    }

    .feature-highlight-active {
      width: 100%;
    }
  }
}

.final-cta {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  margin: 40px;
  border: 2px solid #1565c0;
  width: calc(100% - 80px);
  box-sizing: border-box;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    animation: pulse 10s infinite alternate;
  }

  .cta-content {
    position: relative;
    z-index: 1;
  }

  .cta-title {
    color: white;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .cta-button {
    padding: 16px 40px;
    font-weight: bold;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border: none !important;
    background: white !important;
    color: #1976d2 !important;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
      background: #f8f9fa !important;
    }
  }

  .cta-subtitle {
    color: rgba(255, 255, 255, 0.7);
  }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(1.2); opacity: 0.8; }
}

body.body--dark {
  .homepage {
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%) !important;
  }

  .dark-mode-toggle .toggle-btn {
    background: #424242 !important;
    color: #f5f5f5 !important;
    border: 3px solid white !important;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);

    &:hover {
      border-color: #e0e0e0 !important;
      background: #616161 !important;
      transform: scale(1.1) rotate(12deg);
    }
  }

  .hero-section .hero-background {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%) !important;

    &::before {
      background: radial-gradient(circle, rgba(66, 165, 245, 0.05) 0%, transparent 70%);
    }

    &::after {
      opacity: 0.1;
      background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="white" opacity=".05"/></svg>') !important;
    }
  }

  .hero-btn {
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%) !important;
    color: white !important;
    box-shadow: 0 8px 25px rgba(25, 118, 210, 0.3) !important;

    &:hover {
      background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%) !important;
      box-shadow: 0 12px 35px rgba(25, 118, 210, 0.4) !important;
    }
  }

  .text-gradient {
    background: linear-gradient(135deg, #42a5f5 0%, #1976d2 50%, #0d47a1 100%);
    -webkit-background-clip: text;
    background-clip: text;
  }

  .stats-section {
    background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);

    .stat-value { color: #42a5f5; }
    .stat-label { color: #b0b0b0; }
  }

  .feature-carousel {
    background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);

    .feature-content .feature-btn {
      background: rgba(66, 165, 245, 0.1) !important;
      color: #42a5f5 !important;

      &:hover {
        background: rgba(66, 165, 245, 0.2) !important;
        box-shadow: 0 4px 15px rgba(66, 165, 245, 0.2);
      }
    }
  }

  .custom-carousel-controls .control-btn {
    background: rgba(30, 30, 30, 0.9) !important;
    color: #42a5f5 !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
  }

  .interactive-features .feature-card {
    background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;

    &:hover {
      border-color: #42a5f5 !important;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }

    .feature-icon {
      background: linear-gradient(135deg, rgba(66, 165, 245, 0.1) 0%, rgba(25, 118, 210, 0.1) 100%) !important;
      color: #42a5f5 !important;
    }

    .feature-icon-hovered {
      background: linear-gradient(135deg, #42a5f5 0%, #1976d2 100%) !important;
    }

    .feature-card-title { color: #ffffff !important; }
    .feature-card-description { color: #a0a0a0 !important; }
    .feature-highlight { background: linear-gradient(135deg, #42a5f5 0%, #1976d2 100%) !important; }
  }

  .final-cta {
    background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;

    .cta-button {
      background: rgba(30, 30, 30, 0.9) !important;
      color: #42a5f5 !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;

      &:hover { background: rgba(40, 40, 40, 0.9) !important; }
    }
  }
}

@media (max-width: 768px) {
  .dark-mode-toggle {
    bottom: 16px;
    left: 16px;
  }

  .toggle-btn {
    width: 56px;
    height: 56px;
  }

  .final-cta {
    margin: 20px;
    width: calc(100% - 40px);
  }

  .features-grid {
    grid-template-columns: 1fr !important;
  }

  .hero-section {
    padding: 80px 16px;

    .hero-title { font-size: 2rem !important; }
    .hero-subtitle { font-size: 1.25rem !important; }
  }

  .features-section,
  .interactive-features {
    padding-left: 16px !important;
    padding-right: 16px !important;
  }

  .carousel-wrapper {
    .feature-carousel {
      height: auto !important;
      min-height: 400px;

      .feature-content {
        padding: 20px !important;
        text-align: center;
      }

      .feature-image {
        height: 250px !important;
        margin: 0 auto;
      }
    }

    .custom-carousel-controls {
      flex-direction: column;
      gap: 15px;

      .slide-indicators { order: -1; }
    }
  }
}

:global(html),
:global(body),
:global(#q-app),
:global(.q-layout),
:global(.q-page-container) {
  overflow-x: clip;
  max-width: 100%;
}

:global(body) {
  margin: 0;
  padding: 0;
}

.q-btn, .stats-section, .feature-carousel, .feature-card,
.toggle-btn, .hero-btn, .feature-btn, .cta-button,
.feature-icon, .control-btn, .indicator-btn {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

:global(html) {
  scroll-behavior: smooth;
}

.feature-image {
  transform: translateZ(0);
  backface-visibility: hidden;
}
</style>
