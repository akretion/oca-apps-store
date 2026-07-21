// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/icon',
    '@nuxt/ui',
    '@nuxtjs/mdc',
    '@nuxt/content',
    '@nuxtjs/i18n',
    '@nuxt/eslint',
    '@nuxt/image',
    '@pinia/nuxt',
    '@nuxtjs/device',
    '@vite-pwa/nuxt',
    '@vueuse/nuxt',
    '@vueuse/motion',
    'nuxt-schema-org',
    'nuxt-site-config',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
    '@nuxt/scripts',
    'nuxt-seo-utils',
    'nuxt-vitalizer'
  ],
  vitalizer: {
    // Remove the render-blocking entry CSS
    disableStylesheets: "entry",
    disablePrefetchLinks: true,
    disablePreloadLinks: true,

  },
  features: {
    inlineStyles: true
  },
  nitro: {
    compressPublicAssets: true,
    storage: {
      cache: {
        driver: 'fs',
        base: './.data/cache',
      },
    },
  },
  image: {
    format: ['webp'],
    domains: ['odoo-community.org'],
  },

  plugins: ['~/plugins/services/index', '~/plugins/sponsorship'],
  ssr: true,
  devtools: { enabled: true },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    rootAttrs: {
      'data-vaul-drawer-wrapper': '',
      class: 'bg-default',
    },
    head: {
      meta: [{ name: 'theme-color', content: '#151B47' }],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.png' }],
    },
  },
  site: {
    url: 'https://apps.odoo-community.org',
    name: 'OCA Apps Store',
    title: 'Odoo Community Association Appstore',
    description:
      'OCA Appstore is the place to find and share Odoo apps, modules, and services developed by the Odoo Community Association (OCA).',
  },
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    autoI18n: false,
    sitemaps: {
      modules: {
        sources: ['/api/__sitemap__/modules'],
      },
      companies: {
        sources: ['/api/__sitemap__/companies'],
      },
      persons: {
        sources: ['/api/__sitemap__/persons'],
      },
      categories: {
        sources: ['/api/__sitemap__/categories'],
      },
    }
  },
  ui: {
    colorMode: true,
  },
  spaLoadingTemplate: 'assets/templates/loading.html',
  runtimeConfig: {
    // Serveur-side only configuration
    basicAuth: process.env.NUXT_BASIC_AUTH || '',
    // Client-side and server-side configuration
    public: {
      search: {
        url: process.env.NUXT_PUBLIC_SEARCH_URL || '',
        key: process.env.NUXT_PUBLIC_SEARCH_KEY || '',
        indices: {
          persons: {
            en: process.env.NUXT_PUBLIC_SEARCH_INDICES_PERSONS_EN || '',
          },
          companies: {
            en: process.env.NUXT_PUBLIC_SEARCH_INDICES_COMPANIES_EN || '',
          },
          modules: {
            en: process.env.NUXT_PUBLIC_SEARCH_INDICES_MODULES_EN || '',
          },
          categories: {
            en: process.env.NUXT_PUBLIC_SEARCH_INDICES_CATEGORIES_EN || '',
          },
        },
      },
      gtm: {
        id: process.env.NUXT_PUBLIC_GTM_ID,
      },
    },
  },

  alias: {
    '#models': '/models',
    '#services': '/services',
  },
  routeRules: {
    '/': {
      ssr: true,
      swr: 3600,
    },
    '/community': {
      ssr: true,
      swr: 3600,
    },
    '/community/**': {
      prerender: false,
      ssr: true,
      swr: 3600,
    },
    '/modules/**': {
      prerender: false,
      ssr: true,
      swr: 3600,
    },
    '/modules': {
      ssr: true,
      swr: 3600,
    },
    '/module': {
      redirect: '/modules',
    },
    'shop': {
      redirect: '/modules',
    },
    '/categories': {
      ssr: true,
      swr: 3600,
    },
    '/categories/**': {
      ssr: true,
      swr: 3600,
    },
    '/sponsors': {
      ssr: true,
      swr: 3600,
    },
    '/integrators': {

      ssr: true,
      swr: 3600,
    },
    '/integrators/**': {
      prerender: false,
      ssr: true,
      swr: 3600,
    },
    '/**': {
      ssr: true,
    },
  },
  sourcemap: {
    server: false,
    client: false,
  },
  compatibilityDate: '2025-07-16',
  eslint: {
    config: {
      stylistic: false,
    },
  },
  i18n: {
    defaultLocale: 'en',
    locales: [
      {
        code: 'en',
        language: 'en_us',
        name: 'English',
        file: 'en-US.json',
        icon: 'i-circle-flags-lang-en',
      },
    ],
    langDir: 'locales/',
    strategy: 'prefix_and_default',
    detectBrowserLanguage: false,
  },
  pwa: {
    strategies: 'injectManifest',
    srcDir: 'pwa',
    filename: 'sw.ts',
    registerType: 'prompt',
    manifest: {
      name: 'OCA Appstore',
      short_name: 'OCA Appstore',
      description: 'OCA Appstore PWA',
      theme_color: '#283687',
      start_url: '/',
      display: 'standalone',

      background_color: '#ffffff',
      icons: [
        {
          src: '/logo-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/logo-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
      categories: ['shopping', 'utilities'],
      id: '/',
      display_override: ['window-controls-overlay', 'standalone'],
      launch_handler: {
        client_mode: 'navigate-existing',
      },
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: true,
    },
  },
})