<template>
  <q-layout class="register">
    <q-page-container>
      <q-page class="flex flex-center bg-grey-2">
        <div>
          <q-card class="register-card q-pa-xl">
            <q-card-section class="text-center">
              <div class="text-h4 q-mb-md text-primary">Create Your Account</div>
              <div class="text-subtitle1 q-mb-lg text-grey-8">
                Sign up to start managing your finances.
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
                label="Register"
                color="primary"
                class="full-width q-mb-md"
                @click="registerUser"
              />

              <q-card-actions align="center">
                <p class="text-body1 text-grey-8">
                  Already have an account?
                  <span
                    @click="goToLoginPage"
                    class="text-primary cursor-pointer"
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

<style scoped>
.register {
  background-color: #f5f5f5;
}

.register-card {
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