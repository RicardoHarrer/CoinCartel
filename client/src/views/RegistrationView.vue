<script>
import axios from 'axios';

export default {
  name: 'registerPage',
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
      this.$router.push('/');
    },
  },
};
</script>

<template>
  <q-layout class="register">
    <q-page-container>
      <q-page class="flex flex-center">
        <div>
          <q-card class="q-pa-xl" style="max-width: 400px; width: 100%">
            <q-card-section>
              <div class="text-h4 q-mb-md text-center">Register</div>

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
                label="Register"
                class="full-width"
                @click="registerUser"
              />
              <q-card-actions>
                <p>
                  Already have an account?
                  <span @click="goToLoginPage" style="color: #9ccc65; cursor: pointer"
                    >Sign In</span
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
