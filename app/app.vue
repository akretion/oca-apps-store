<template>
  <UApp :toaster="{ position: 'top-right', duration: 3000 }">
    <NuxtPwaManifest />
    <NuxtLoadingIndicator color="#151B47" />
    <UMain data-vaul-drawer-wrapper>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>
  </UApp>
</template>

<script setup lang="ts">
import '~/assets/css/main.css'

const { t } = useI18n()

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - ${t('seo.title')}` : t('seo.title')
  },
  meta: [
    {
      name: 'description',
      content: t('seo.description'),
    },
  ],
})
useSchemaOrg([
  defineWebPage({
    name: t('seo.title'),
  }),
  defineWebSite({
    name: t('seo.title'),
  }),
  defineOrganization({
    name: 'Odoo Community Association',
    url: 'https://odoo-community.org',
    logo: 'https://odoo-community.org/logo.png',
  }),
])
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}
</style>
