// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: [
      "@nuxtjs/tailwindcss"
  ],

  runtimeConfig: {
      FIREBASE_API_KEY: "AIzaSyA6JO1QvIgOeArFgRBTJQZBkxr45yjtZ1o",
      FIREBASE_AUTH_DOMAIN: "ngage-demo-2e589.firebaseapp.com",
      FIREBASE_PROJECT_ID: "ngage-demo-2e589",
      FIREBASE_STORAGE_BUCKET: "ngage-demo-2e589.appspot.com",
      FIREBASE_MESSAGING_SENDER_ID: "1019833441830",
      FIREBASE_APP_ID: "1:1019833441830:web:78ae615a66e097ab1510e7",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      public: {
          FIREBASE_API_KEY: "AIzaSyA6JO1QvIgOeArFgRBTJQZBkxr45yjtZ1o",
          FIREBASE_AUTH_DOMAIN: "ngage-demo-2e589.firebaseapp.com",
          FIREBASE_PROJECT_ID: "ngage-demo-2e589",
          FIREBASE_STORAGE_BUCKET: "ngage-demo-2e589.appspot.com",
          FIREBASE_MESSAGING_SENDER_ID: "1019833441830",
          FIREBASE_APP_ID: "1:1019833441830:web:78ae615a66e097ab1510e7",
          OPENAI_API_KEY: process.env.OPENAI_API_KEY
      }
  },

  css: [
      "@/assets/css/main.css"
  ],

  compatibilityDate: "2024-08-25"
})