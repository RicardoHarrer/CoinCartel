<script>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter} from 'vue-router';
import { useQuasar } from 'quasar';

export default {
  name: 'LoginPage',
  setup() {
    const username = ref('');
    const password = ref('');
    const router = useRouter();
    const $q = useQuasar();

    const loginUser = async () => {
      try {
        const response = await axios.post('http://localhost:3000/login', {
          username: username.value,
          password: password.value,
        });

        const { token } = response.data;
        localStorage.setItem('token', token);

        router.push('/chart');
      } catch (error) {
        console.error(error);
      }
    };

    return {
      username,
      password,
      loginUser,
      $q,
    };
  },
  methods: {
    goToRegisterPage() {
      this.$router.push('/register');
    },
  },
};
</script>


<template>
  <q-layout :class="['login', $q.dark.isActive ? 'bg-dark' : 'bg-grey-2']">
    <q-page-container>
      <q-page class="flex flex-center">
        <div>
          <q-card class="login-card q-pa-xl">
            <q-card-section class="text-center">
              <div :class="['text-h4', 'q-mb-md', $q.dark.isActive ? 'text-white' : 'text-primary']">
                Welcome Back
              </div>
              <div :class="['text-subtitle1', 'q-mb-lg', $q.dark.isActive ? 'text-grey-4' : 'text-grey-8']">
                Sign in to manage your finances.
              </div>

              <q-input
                filled
                v-model="username"
                label="Username"
                type="text"
                placeholder="Enter your username"
                class="q-mb-md"
                :dark="$q.dark.isActive"
              />

              <q-input
                filled
                v-model="password"
                label="Password"
                type="password"
                placeholder="Enter your password"
                class="q-mb-md"
                :dark="$q.dark.isActive"
              />

              <q-btn
                label="Login"
                :color="$q.dark.isActive ? 'secondary' : 'primary'"
                class="full-width q-mb-md"
                @click="loginUser"
              />

              <q-card-actions align="center">
                <p :class="['text-body1', $q.dark.isActive ? 'text-grey-4' : 'text-grey-8']">
                  Don't have an account?
                  <span
                    @click="goToRegisterPage"
                    :class="['cursor-pointer', $q.dark.isActive ? 'text-white' : 'text-primary']"
                    style="text-decoration: underline"
                  >
                    Sign Up
                  </span>
                </p>
              </q-card-actions>
            </q-card-section>
          </q-card>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.login {
  transition: background-color 0.3s ease;
}

.login-card {
  max-width: 400px;
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.bg-dark {
  background-color: #1d1d1d;
}

.text-white {
  color: white;
}

.text-grey-4 {
  color: #bdbdbd;
}

.cursor-pointer {
  cursor: pointer;
}
</style>