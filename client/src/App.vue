<script>
import { RouterView } from "vue-router";
import Navbar from "./components/NavBar.vue";
import { useRoute } from "vue-router";
import { onMounted, watch } from "vue";

export default {
  components: { Navbar, RouterView },
  setup() {
    const route = useRoute();
    
    const showNavbar = () => {
      return !route.meta.hideNavbar;
    };

    const isAuthRoute = () => route.path === "/login" || route.path === "/register";
    const showTranslateWidget = () => !isAuthRoute();

    const setGoogleTranslateCookie = (langCode) => {
      const target = (langCode || "en").toLowerCase();
      const cookieValue = `/en/${target}`;
      document.cookie = `googtrans=${cookieValue};path=/`;

      const host = window.location.hostname;
      if (host && host !== "localhost" && !/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
        document.cookie = `googtrans=${cookieValue};path=/;domain=.${host}`;
      }
    };

    const applySavedLanguage = () => {
      const savedLang = localStorage.getItem("vaultly_selected_language");
      if (!savedLang) return;
      setGoogleTranslateCookie(savedLang);
      document.documentElement.setAttribute("lang", savedLang);
    };

    const enforceRouteTranslationPolicy = () => {
      if (isAuthRoute()) {
        setGoogleTranslateCookie("en");
        document.documentElement.setAttribute("lang", "en");
        document.body.classList.remove("translated-ltr", "translated-rtl");
        document.body.style.top = "0px";
        return;
      }
      applySavedLanguage();
    };

    const initGoogleTranslate = () => {
      if (document.getElementById("google_translate_script")) return;

      window.googleTranslateElementInit = () => {
        if (!window.google || !window.google.translate) return;
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            autoDisplay: false,
          },
          "google_translate_element"
        );
      };

      const script = document.createElement("script");
      script.id = "google_translate_script";
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    };

    onMounted(() => {
      enforceRouteTranslationPolicy();
      initGoogleTranslate();
    });

    watch(
      () => route.path,
      () => {
        enforceRouteTranslationPolicy();
      }
    );

    return {
      showNavbar,
      showTranslateWidget,
    };
  },
};
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <div
      v-if="showTranslateWidget()"
      id="google_translate_element"
      class="google-translate-widget"
    ></div>
    <Navbar v-if="showNavbar()" />
    <q-page-container>
      <RouterView />
    </q-page-container>
  </q-layout>
</template>

<style>
.dark-mode-toggle {
  position: fixed !important;
  left: 20px !important;
  right: auto !important;
  bottom: 20px !important;
  z-index: 1100 !important;
}

.toggle-btn {
  width: 54px !important;
  height: 54px !important;
  border-radius: 14px !important;
  border: 1px solid rgba(148, 163, 184, 0.38) !important;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.22) !important;
  backdrop-filter: blur(10px);
  transition: transform 0.2s ease, box-shadow 0.2s ease !important;
}

.toggle-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.3) !important;
}

.body--dark .toggle-btn {
  border-color: rgba(100, 116, 139, 0.44) !important;
  box-shadow: 0 12px 30px rgba(2, 6, 23, 0.62) !important;
}

@media (max-width: 768px) {
  .dark-mode-toggle {
    left: 14px !important;
    bottom: 14px !important;
  }

  .toggle-btn {
    width: 50px !important;
    height: 50px !important;
  }
}

.google-translate-widget {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 2000;
}

/* Hide the legacy Google top banner and keep layout fixed */
body {
  top: 0 !important;
  position: static !important;
}

iframe.goog-te-banner-frame,
.goog-te-banner-frame,
.goog-te-banner-frame.skiptranslate {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
}

body > .skiptranslate {
  display: none !important;
}
</style>
