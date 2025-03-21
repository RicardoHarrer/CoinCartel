<template>
  <q-layout class="login">
    <q-page-container>
      <q-page class="flex flex-center bg-grey-2">
        <div>
          <q-card class="login-card q-pa-xl">
            <q-card-section class="text-center">
              <div class="text-h4 q-mb-md text-primary">Welcome Back</div>
              <div class="text-subtitle1 q-mb-lg text-grey-8">
                Sign in to manage your finances.
              </div>

              <q-input
                filled
                v-model="username"
                label="Username"
                type="text"
                placeholder="Enter your username"
                class="q-mb-md"
              />

              <q-input
                filled
                v-model="password"
                label="Password"
                type="password"
                placeholder="Enter your password"
                class="q-mb-md"
              />

              <q-btn
                label="Login"
                color="primary"
                class="full-width q-mb-md"
                @click="loginUser"
              />

              <q-card-actions align="center">
                <p class="text-body1 text-grey-8">
                  Don't have an account?
                  <span
                    @click="goToRegisterPage"
                    class="text-primary cursor-pointer"
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

<script>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

export default {
  name: 'LoginPage',
  setup() {
    const username = ref('');
    const password = ref('');
    const router = useRouter();

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
    };
  },
  methods: {
    goToRegisterPage() {
      this.$router.push('/register');
    },
  },
};
</script>

<style scoped>
.login {
  background-color: #f5f5f5;
}

.login-card {
  max-width: 400px;
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.text-primary {
  color: #1976d2;
}

.bg-primary {
  background-color: #1976d2;
}

.text-grey-8 {
  color: #616161;
}

.cursor-pointer {
  cursor: pointer;
}
</style>