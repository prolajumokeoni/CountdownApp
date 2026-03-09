import { createApp } from 'vue'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import App from './App.vue'
import './style.css'

const app = createApp(App)

app.use(Toast, {
  position: 'bottom-right',
  timeout: 3500,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  hideProgressBar: false,
  maxToasts: 5,
  newestOnTop: true,
})

app.mount('#app')
