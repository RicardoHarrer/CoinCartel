// Homeview.vue
<template>
  <q-page class="homepage">
    <section class="hero-section text-center q-pa-xl">
      <div class="hero-background"></div>
      <div class="hero-content">
        <h1
          class="hero-title text-h2 text-weight-bold q-mb-md animate__animated animate__fadeInDown"
        >
          Take Control of Your <span class="text-gradient">Finances</span>
        </h1>
        <p
          class="hero-subtitle text-h5 q-mb-xl animate__animated animate__fadeIn animate__delay-1s"
        >
          Powerful tools to track, analyze and optimize your financial health
        </p>
        <q-btn
          label="Get Started"
          color="white"
          text-color="primary"
          size="lg"
          class="animate__animated animate__fadeInUp animate__delay-1s"
          @click="navigateToAuth"
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
      <h2
        class="section-title text-h4 text-center text-weight-bold q-mb-xl animate__animated animate__fadeIn"
      >
        Why Choose Our Financial Tracker
      </h2>

      <q-carousel
        v-model="slide"
        animated
        infinite
        autoplay
        height="500px"
        class="feature-carousel"
      >
        <q-carousel-slide
          v-for="(feature, index) in features"
          :key="feature.title"
          :name="index"
          class="column no-wrap flex-center"
        >
          <div class="row items-center q-col-gutter-xl full-height">
            <div class="col-md-6">
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
                  label="Learn more"
                  color="primary"
                  flat
                  class="q-mt-md"
                  @click="navigateToAuth"
                />
              </div>
            </div>
            <div class="col-md-6">
              <q-img
                :src="feature.image"
                :alt="feature.title"
                class="feature-image animate__animated animate__fadeInRight"
                :class="{ animate__zoomIn: slide === index }"
              />
            </div>
          </div>
        </q-carousel-slide>
      </q-carousel>
    </section>

    <section class="final-cta text-center q-px-xl q-py-xl">
      <div
        class="cta-content animate__animated animate__pulse animate__infinite animate__slower"
      >
        <h2 class="cta-title text-h3 text-weight-bold q-mb-md">
          Ready to Transform Your Financial Life?
        </h2>
        <q-btn
          label="Get Started for free"
          color="white"
          text-color="primary"
          size="lg"
          class="cta-button"
          @click="navigateToAuth"
        />
        <p class="cta-subtitle q-mt-md text-caption">
          No credit card required · Cancel anytime
        </p>
      </div>
    </section>
  </q-page>
</template>

<script>
import { useRouter } from "vue-router";
import { useQuasar, QCarousel, QCarouselSlide } from "quasar";
import { ref, onMounted } from "vue";
import "animate.css";
import { auth } from "@/utils/auth";

export default {
  components: {
    QCarousel,
    QCarouselSlide,
  },
  setup() {
    const router = useRouter();
    const $q = useQuasar();
    const slide = ref(0);

    const navigateToAuth = () => {
      if (auth.isAuthenticated()) {
        router.push("/chart");
      } else {
        router.push("/register");
      }
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

    onMounted(() => {
      const counters = document.querySelectorAll(".stat-value");
      const speed = 200;

      counters.forEach((counter) => {
        const target = +counter.getAttribute("data-target");
        const count = +counter.innerText.replace("%", "").replace("€", "");
        const increment = target / speed;

        if (count < target) {
          const updateCount = () => {
            const c = +counter.innerText.replace("%", "").replace("€", "");
            let newCount;

            if (c < target) {
              newCount = Math.ceil(c + increment);
              if (newCount > target) newCount = target;
              counter.innerText = counter.getAttribute("data-target").includes("%")
                ? newCount + "%"
                : counter.getAttribute("data-target").includes("€")
                ? newCount + "€"
                : counter.getAttribute("data-target") === "A+"
                ? "A+"
                : newCount;
              setTimeout(updateCount, 1);
            }
          };
          updateCount();
        }
      });
    });

    return {
      navigateToAuth,
      stats,
      features,
      slide,
      darkMode: $q.dark.isActive,
    };
  },
};
</script>

<style lang="scss" scoped>
.homepage {
  overflow-x: hidden;

  .hero-section {
    position: relative;
    padding: 120px 20px;
    min-height: 80vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

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
    }

    @media (min-width: $breakpoint-md-min) {
      padding: 160px 20px;
    }
  }

  .text-gradient {
    background: linear-gradient(90deg, $primary 0%, lighten($primary, 20%) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    display: inline-block;
  }

  .stats-section {
    border-radius: 0;
    background: white;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    margin-top: -50px;
    position: relative;
    z-index: 1;

    .stat-value {
      color: $primary;
      font-size: 3rem;
      margin-bottom: 10px;
    }

    .stat-label {
      color: $grey-7;
      font-weight: 500;
    }
  }

  .feature-carousel {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);

    .feature-content {
      padding: 40px;

      .feature-title {
        line-height: 1.2;
        margin-bottom: 20px;
      }

      .feature-description {
        color: $grey-7;
        line-height: 1.6;
        margin-bottom: 20px;
      }
    }

    .feature-image {
      border-radius: 12px;
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
      height: 400px;
      object-fit: cover;
      transition: all 0.5s ease;
    }

    .q-carousel__navigation {
      padding: 16px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 20px;

      &-inner {
        .q-carousel__navigation-icon {
          color: white;
          background: rgba(255, 255, 255, 0.3);
          padding: 6px;
          margin: 0 4px;

          &--active {
            background: white;
            transform: scale(1.2);
          }
        }
      }
    }
  }

  .final-cta {
    background: linear-gradient(135deg, $primary 0%, darken($primary, 10%) 100%);
    position: relative;
    overflow: hidden;

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
      padding: 12px 32px;
      font-weight: bold;
      border-radius: 50px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
      }
    }

    .cta-subtitle {
      color: rgba(255, 255, 255, 0.7);
    }
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.5;
    }
    100% {
      transform: scale(1.2);
      opacity: 0.8;
    }
  }

  /* Dark mode adjustments */
  body.body--dark & {
    .hero-section {
      .hero-background {
        background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);

        &::before {
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.05) 0%,
            transparent 70%
          );
        }

        &::after {
          opacity: 0.2;
        }
      }
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

    .stats-section {
      background: $dark-page !important;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .feature-carousel {
      background: $dark-page;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);

      .feature-content {
        .feature-description {
          color: rgba(255, 255, 255, 0.7);
        }
      }

      .q-carousel__navigation {
        background: rgba(255, 255, 255, 0.1);

        &-inner {
          .q-carousel__navigation-icon {
            background: rgba(255, 255, 255, 0.2);

            &--active {
              background: white;
            }
          }
        }
      }
    }
  }
}
</style>
