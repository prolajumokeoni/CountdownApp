import Toast from 'vue-toastification'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Toast, {
    position: 'bottom-right',
    timeout: 3500,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    hideProgressBar: false,
    maxToasts: 5,
    newestOnTop: true,
  })
})
