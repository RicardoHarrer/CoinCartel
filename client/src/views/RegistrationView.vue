<template>
  <q-layout :class="['register-layout', $q.dark.isActive ? 'bg-dark' : 'bg-light']">
    <div class="svg-background">
      <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" :stop-color="$q.dark.isActive ? '#4361ee' : '#667eea'" stop-opacity="0.3" />
            <stop offset="100%" :stop-color="$q.dark.isActive ? '#3a0ca3' : '#764ba2'" stop-opacity="0.1" />
          </linearGradient>
          <linearGradient id="gradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" :stop-color="$q.dark.isActive ? '#4cc9f0' : '#f093fb'" stop-opacity="0.2" />
            <stop offset="100%" :stop-color="$q.dark.isActive ? '#7209b7' : '#f5576c'" stop-opacity="0.1" />
          </linearGradient>
        </defs>

        <circle class="svg-shape shape-1" cx="100" cy="150" r="40" fill="url(#gradient1)" />
        <circle class="svg-shape shape-2" cx="1100" cy="300" r="60" fill="url(#gradient2)" />
        <circle class="svg-shape shape-3" cx="200" cy="600" r="50" fill="url(#gradient1)" />
        <circle class="svg-shape shape-4" cx="900" cy="100" r="45" fill="url(#gradient2)" />
        
        <g class="svg-icon icon-1">
          <path :stroke="$q.dark.isActive ? 'rgba(67, 97, 238, 0.4)' : 'rgba(102, 126, 234, 0.4)'" stroke-width="2" fill="none" 
                d="M300 200 Q350 150 400 200 T500 200" />
          <path :stroke="$q.dark.isActive ? 'rgba(76, 201, 240, 0.4)' : 'rgba(240, 147, 251, 0.4)'" stroke-width="2" fill="none" 
                d="M300 250 Q450 100 500 250" />
          <circle cx="300" cy="200" r="3" :fill="$q.dark.isActive ? '#4361ee' : '#667eea'" />
          <circle cx="500" cy="200" r="3" :fill="$q.dark.isActive ? '#4361ee' : '#667eea'" />
          <circle cx="300" cy="250" r="3" :fill="$q.dark.isActive ? '#4cc9f0' : '#f093fb'" />
          <circle cx="500" cy="250" r="3" :fill="$q.dark.isActive ? '#4cc9f0' : '#f093fb'" />
        </g>

        <g class="svg-icon icon-2">
          <rect x="700" y="400" width="80" height="120" rx="10" 
                :fill="$q.dark.isActive ? 'rgba(67, 97, 238, 0.2)' : 'rgba(102, 126, 234, 0.2)'" 
                :stroke="$q.dark.isActive ? 'rgba(67, 97, 238, 0.5)' : 'rgba(102, 126, 234, 0.5)'" stroke-width="1.5" />
          <rect x="720" y="420" width="40" height="20" rx="5" 
                :fill="$q.dark.isActive ? 'rgba(76, 201, 240, 0.6)' : 'rgba(240, 147, 251, 0.6)'" />
          <line x1="720" y1="470" x2="780" y2="470" 
                :stroke="$q.dark.isActive ? 'rgba(76, 201, 240, 0.8)' : 'rgba(240, 147, 251, 0.8)'" stroke-width="2" />
          <line x1="720" y1="490" x2="760" y2="490" 
                :stroke="$q.dark.isActive ? 'rgba(76, 201, 240, 0.8)' : 'rgba(240, 147, 251, 0.8)'" stroke-width="2" />
        </g>

        <path class="connection-line line-1" d="M400 200 L600 300" 
              :stroke="$q.dark.isActive ? 'rgba(67, 97, 238, 0.2)' : 'rgba(102, 126, 234, 0.2)'" stroke-width="1.5" fill="none" />
        <path class="connection-line line-2" d="M200 600 L400 500" 
              :stroke="$q.dark.isActive ? 'rgba(76, 201, 240, 0.2)' : 'rgba(240, 147, 251, 0.2)'" stroke-width="1.5" fill="none" />
      </svg>
    </div>

    <div class="dark-mode-toggle">
      <q-btn 
        round 
        :color="$q.dark.isActive ? 'grey-9' : 'yellow-9'" 
        :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'" 
        class="toggle-btn"
        @click="toggleDarkMode"
        size="lg"
      >
      </q-btn>
    </div>

    <q-page-container>
      <q-page class="flex flex-center">
        <q-card 
          class="register-card q-pa-xl animated-card"
          :class="{ 'dark-card': $q.dark.isActive }"
        >
          <q-card-section class="text-center q-pb-none">
            <div class="logo-container q-mb-md">
              <q-icon 
                name="account_balance_wallet" 
                size="xl"
                :color="$q.dark.isActive ? 'primary' : 'primary'"
                class="logo-icon"
              />
            </div>
            <div
              :class="[
                'text-h4',
                'q-mb-sm',
                'font-weight-bold',
                $q.dark.isActive ? 'text-white' : 'text-dark'
              ]"
            >
              Create Your Account
            </div>
            <div
              :class="[
                'text-subtitle1',
                'q-mb-lg',
                $q.dark.isActive ? 'text-grey-4' : 'text-grey-7',
              ]"
            >
              Sign up to start managing your finances
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div class="input-container q-mb-lg">
              <q-input
                filled
                v-model="username"
                label="Username"
                type="text"
                maxlength="16"
                placeholder="Enter your username"
                :dark="$q.dark.isActive"
                class="custom-input"
                @focus="onInputFocus"
                @blur="onInputBlur"
              >
                <template v-slot:prepend>
                  <q-icon name="person" />
                </template>
              </q-input>
            </div>

            <div class="input-container q-mb-lg">
              <q-input
                filled
                v-model="password"
                label="Password"
                type="password"
                placeholder="Enter your password"
                :dark="$q.dark.isActive"
                class="custom-input"
                @focus="onInputFocus"
                @blur="onInputBlur"
              >
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
              </q-input>
            </div>

            <div class="consent-container q-mb-lg">
              <q-checkbox
                v-model="acceptPrivacyPolicy"
                :dark="$q.dark.isActive"
                class="consent-checkbox"
                color="primary"
              >
                <span>
                  Ich stimme der
                  <a
                    href="/datenschutz"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="consent-link"
                    @click.stop
                  >
                    Datenschutzerklaerung
                  </a>
                  zu.
                </span>
              </q-checkbox>

              <q-checkbox
                v-model="acceptTerms"
                :dark="$q.dark.isActive"
                class="consent-checkbox"
                color="primary"
              >
                <span>
                  Ich akzeptiere die
                  <a
                    href="/agb"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="consent-link"
                    @click.stop
                  >
                    Nutzungsbedingungen (AGB)
                  </a>.
                </span>
              </q-checkbox>
            </div>

            <q-btn
              label="Create Account"
              :color="$q.dark.isActive ? 'primary' : 'primary'"
              class="full-width q-mb-lg register-btn"
              size="lg"
              @click="registerUser"
              :loading="loading"
            >
              <template v-slot:loading>
                <q-spinner-hourglass class="on-left" />
                Creating account...
              </template>
            </q-btn>

            <q-card-actions align="center" class="q-pa-none">
              <p :class="[
                'text-body2',
                $q.dark.isActive ? 'text-grey-4' : 'text-grey-7'
              ]">
                Already have an account?
                <span
                  @click="goToLoginPage"
                  :class="[
                    'cursor-pointer',
                    'text-weight-bold',
                    'q-ml-xs',
                    $q.dark.isActive ? 'text-primary' : 'text-primary'
                  ]"
                >
                  Sign In
                </span>
              </p>
            </q-card-actions>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { auth } from '@/utils/auth';

export default {
  name: 'RegisterPage',
  setup() {
    const username = ref('');
    const password = ref('');
    const acceptPrivacyPolicy = ref(false);
    const acceptTerms = ref(false);
    const loading = ref(false);
    const router = useRouter();
    const $q = useQuasar();

    const toggleDarkMode = () => {
      $q.dark.set(!$q.dark.isActive);
    };

    const onInputFocus = (event) => {
      event.target.closest('.q-field').classList.add('focused');
    };

    const onInputBlur = (event) => {
      event.target.closest('.q-field').classList.remove('focused');
    };

    const registerUser = async () => {
      const trimmedUsername = username.value.trim();
      if (!trimmedUsername || !password.value) {
        $q.notify({
          type: 'warning',
          message: 'Please fill in all fields.',
          position: 'top'
        });
        return;
      }
      if (trimmedUsername.length > 16) {
        $q.notify({
          type: 'warning',
          message: 'Username darf maximal 16 Zeichen haben.',
          position: 'top'
        });
        return;
      }
      if (!acceptPrivacyPolicy.value || !acceptTerms.value) {
        $q.notify({
          type: 'warning',
          message: 'Bitte stimme Datenschutz und AGB zu, um dich zu registrieren.',
          position: 'top'
        });
        return;
      }

      loading.value = true;
      
      try {
        const response = await axios.post('http://localhost:3000/register', {
          username: trimmedUsername,
          password: password.value,
        });

        const { token } = response.data;
        auth.setToken(token);
        
        $q.notify({
          type: 'positive',
          message: 'Account created successfully!',
          position: 'top'
        });
        
        await router.push('/chart');
      } catch (error) {
        console.error(error);
        const serverMessage =
          error.response?.data?.error ||
          (typeof error.response?.data === 'string' ? error.response.data : null);
        $q.notify({
          type: 'negative',
          message: serverMessage || 'Registration failed. Please try again.',
          position: 'top'
        });
      } finally {
        loading.value = false;
      }
    };

    const goToLoginPage = () => {
      router.push('/login');
    };

    return {
      username,
      password,
      acceptPrivacyPolicy,
      acceptTerms,
      loading,
      toggleDarkMode,
      registerUser,
      goToLoginPage,
      onInputFocus,
      onInputBlur,
      $q,
    };
  },
};
</script>

<style lang="scss" scoped>
.register-layout {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  
  &.bg-light {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  &.bg-dark {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }
}

.svg-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0.7;

  svg {
    filter: blur(0.5px);
  }
}

.svg-shape {
  animation: float 6s ease-in-out infinite;
  
  &.shape-1 {
    animation-delay: 0s;
  }
  
  &.shape-2 {
    animation-delay: -2s;
  }
  
  &.shape-3 {
    animation-delay: -4s;
  }
  
  &.shape-4 {
    animation-delay: -1s;
  }
}

.svg-icon {
  animation: pulse 4s ease-in-out infinite;
  
  &.icon-1 {
    animation-delay: 0s;
  }
  
  &.icon-2 {
    animation-delay: -1.5s;
  }
}

.connection-line {
  stroke-dasharray: 10;
  animation: dash 20s linear infinite;
  
  &.line-1 {
    animation-delay: 0s;
  }
  
  &.line-2 {
    animation-delay: -5s;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0);
  }
  25% {
    transform: translateY(-20px) translateX(10px);
  }
  50% {
    transform: translateY(-10px) translateX(20px);
  }
  75% {
    transform: translateY(-15px) translateX(-10px);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

@keyframes dash {
  to {
    stroke-dashoffset: 1000;
  }
}

.dark-mode-toggle {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  
  .toggle-btn {
    width: 60px;
    height: 60px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.1);
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25);
    }
    
    &:active {
      transform: scale(0.95);
    }
    
    :deep(.q-icon) {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
  }
}

.register-card {
  max-width: 440px;
  width: 90%;
  border-radius: 20px;
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.15),
    0 0 100px rgba(67, 97, 238, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 1;
  position: relative;
  overflow: hidden;
  
  &.dark-card {
    background: rgba(18, 18, 18, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 
      0 25px 50px rgba(0, 0, 0, 0.3),
      0 0 100px rgba(67, 97, 238, 0.1);
  }
}

.animated-card {
  animation: slideUp 0.8s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-container {
  .logo-icon {
    animation: gentlePulse 3s ease-in-out infinite;
  }
}

@keyframes gentlePulse {
  0%, 100% {
    transform: scale(1) rotate(0deg);
  }
  25% {
    transform: scale(1.05) rotate(5deg);
  }
  75% {
    transform: scale(1.05) rotate(-5deg);
  }
}

.input-container {
  position: relative;
}

.consent-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.consent-checkbox .q-checkbox__label) {
  font-size: 0.92rem;
  line-height: 1.45;
}

:deep(.consent-link) {
  color: var(--q-primary);
  font-weight: 700;
  text-decoration: underline;
}

:deep(.custom-input) {
  &:-webkit-autofill,
  &:-webkit-autofill:hover, 
  &:-webkit-autofill:focus, 
  &:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 1000px white inset !important;
    -webkit-text-fill-color: #333 !important;
    transition: background-color 5000s ease-in-out 0s;
  }
  
  .q-dark &:-webkit-autofill,
  .q-dark &:-webkit-autofill:hover, 
  .q-dark &:-webkit-autofill:focus, 
  .q-dark &:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 1000px #1e1e1e inset !important;
    -webkit-text-fill-color: #fff !important;
  }
}

:deep(.q-field--filled) {
  .q-field__control {
    border-radius: 12px;
    transition: all 0.3s ease;
    
    &::before {
      background: transparent !important;
    }
  }
  
  &.q-field--success .q-field__control::before {
    border-color: transparent !important;
  }
  
  &.q-field--focused .q-field__control {
    box-shadow: 0 4px 20px rgba(67, 97, 238, 0.25);
    transform: translateY(-1px);
  }

  &:not(.q-field--dark) .q-field__control {
    background: rgba(255, 255, 255, 0.95) !important;
  }
  
  &.q-field--dark .q-field__control {
    background: rgba(30, 30, 30, 0.95) !important;
  }
  
  &.q-field--success {
    .q-field__label,
    .q-field__native,
    .q-field__prefix,
    .q-field__suffix {
      color: inherit !important;
    }
    
    .q-field__control::before {
      border-color: transparent !important;
    }
  }
}

:deep(.q-field) {
  &.q-field--success {
    .q-field__label {
      color: inherit !important;
    }
    
    .q-field__control {
      color: inherit !important;
      
      &::before {
        border-color: rgba(0, 0, 0, 0.24) !important;
      }
    }
  }
  
  &.q-field--focused {
    .q-field__label {
      color: var(--q-primary) !important;
    }
    
    .q-field__control::before {
      border-color: var(--q-primary) !important;
      border-width: 2px !important;
    }
  }
}

.register-btn {
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(67, 97, 238, 0.4);
  }
}

@media (max-width: 600px) {
  .register-card {
    margin: 20px;
    padding: 24px !important;
    
    .text-h4 {
      font-size: 1.5rem;
    }
  }
  
  .svg-background {
    opacity: 0.5;
  }
  
  .dark-mode-toggle {
    bottom: 16px;
    right: 16px;
    
    .toggle-btn {
      width: 50px;
      height: 50px;
    }
  }
}

@media (max-width: 400px) {
  .register-card {
    padding: 16px !important;
  }
}

.text-h4 {
  font-weight: 700;
  letter-spacing: -0.5px;
}

.text-subtitle1 {
  font-weight: 400;
  line-height: 1.5;
}
</style>
