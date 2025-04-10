<script>
import axios from 'axios';

export default {
  name: 'RegisterPage',
  data() {
    return {
      username: null,
      password: null,
    };
  },
  methods: {
    async registerUser() {
      try {
        const response = await axios.post('http://localhost:3000/register', {
          username: this.username,
          password: this.password,
        });

        const { token } = response.data;
        localStorage.setItem('token', token);

        this.$router.push('/chart');
      } catch (error) {
        console.error(error);
      }
    },
    goToLoginPage() {
      this.$router.push('/login');
    },
  },
};
</script>

<template>
  <q-layout :class="['register', $q.dark.isActive ? 'bg-dark' : 'bg-grey-2']">
    <q-page-container>
      <q-page class="flex flex-center">
        <div>
          <q-card class="register-card q-pa-xl">
            <q-card-section class="text-center">
              <div :class="['text-h4', 'q-mb-md', $q.dark.isActive ? 'text-white' : 'text-primary']">
                Create Your Account
              </div>
              <div :class="['text-subtitle1', 'q-mb-lg', $q.dark.isActive ? 'text-grey-4' : 'text-grey-8']">
                Sign up to start managing your finances.
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
                label="Register"
                :color="$q.dark.isActive ? 'secondary' : 'primary'"
                class="full-width q-mb-md"
                @click="registerUser"
              />

              <q-card-actions align="center">
                <p :class="['text-body1', $q.dark.isActive ? 'text-grey-4' : 'text-grey-8']">
                  Already have an account?
                  <span
                    @click="goToLoginPage"
                    :class="['cursor-pointer', $q.dark.isActive ? 'text-white' : 'text-primary']"
                    style="text-decoration: underline"
                  >
                    Sign In
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
.register {
  transition: background-color 0.3s ease;
}

.register-card {
  max-width: 400px;
  width: 100%;
  border-radius: 8px;
  box-shadow: 2px rgb(255, 255, 255);
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