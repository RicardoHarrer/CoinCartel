<script>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

export default {
  name: 'loginPage',
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

<template>
  <q-layout class="login">
    <q-page-container>
      <q-page class="flex flex-center">
        <div>
          <q-card class="q-pa-xl" style="max-width: 400px; width: 100%">
            <q-card-section>
              <div class="text-h4 q-mb-md text-center">Login</div>

              <q-input
                filled
                v-model="username"
                label="Username"
                type="text"
                :dense="true"
                :placeholder="'Enter your username'"
                class="q-mb-sm"
              />

              <q-input
                filled
                v-model="password"
                label="Password"
                type="password"
                :dense="true"
                :placeholder="'Enter your password'"
                class="q-mb-sm"
              />

              <q-btn
                style="background-color: #dcedc8; color: #1c4300"
                label="Login"
                class="full-width"
                @click="loginUser"
              />
              <q-card-actions align="center">
                <p>
                  Don't have an account?
                  <span @click="goToRegisterPage" style="color: #9ccc65; cursor: pointer"
                    >Sign Up</span
                  >
                </p>
              </q-card-actions>
            </q-card-section>
          </q-card>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style lang="sass">

</style>
