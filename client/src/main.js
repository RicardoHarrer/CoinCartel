import { createApp } from 'vue';
import { LoadingBar, Notify, Quasar } from 'quasar';
import quasarIconSet from 'quasar/icon-set/svg-fontawesome-v6';

import '@quasar/extras/roboto-font/roboto-font.css';
import '@quasar/extras/material-icons/material-icons.css';
import '@quasar/extras/fontawesome-v6/fontawesome-v6.css';
import 'quasar/src/css/index.sass';
import './styles/typography.css';

import App from './App.vue';
import router from './router';

const app = createApp(App);
app.use(Quasar, {
  plugins: { Notify, LoadingBar },
  iconSet: quasarIconSet,
  config: {
    loadingBar: {
      color: 'primary',
      size: '3px',
      position: 'top',
      skipHijack: true,
    },
    notify: {
      position: 'top-right',
      timeout: 2500,
    },
  },
});

app.use(router);

app.mount('#app');
