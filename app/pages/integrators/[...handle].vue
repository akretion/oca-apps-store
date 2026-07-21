<template>
  <div v-if="company" class="max-w-full max-md:w-full">
    <UBreadcrumb :items="breadcrumb" class="mt-8 mb-6" />
    <USeparator />
    <SponsorDetail v-if="company && company?.sponsorship" :sponsor="company" />
    <CompanyHeroBanner v-else-if="company" :company="company" />
    <CompanyHeroBanner v-else :company="company" />
    <CompanyContributor :company="company" />
    <CompanyModulesList :company="company" />
  </div>
</template>

<script lang="ts" setup>
import type { Company, Sponsor } from '~~/models'
const companyService = useService('companies')
const route = useRoute()
const { t } = useI18n()

const { data: company, error } = await useAsyncData<Sponsor | Company | null>(
  `module-${route.params.handle}`,
  () =>
    companyService.findByURLKey(`integrators/${route.params.handle as string}`),
  {
    watch: [route],
  }
)
if (company.value == null || error.value) {
  throw createError({
    statusCode: error?.value ? 500 : 404,
    statusMessage: error?.value?.message || t('companies.notFound'),
    fatal: true,
  })
}

if (route.path !== `/${company.value?.urlKey}`) {
  // redirect to the canonical URL if the path doesn't match the company URL
  navigateTo(`/${company.value?.urlKey}`, { redirectCode: 301 })
}

const breadcrumb = computed(() => {
  const items = []
  if (company.value?.sponsorship) {
    items.push({
      label: t('nav.sponsors.title'),
      to: '/sponsors',
      icon: 'sponsor',
    })
  } else {
    items.push({
      label: t('nav.community.integrators.title'),
      to: '/integrators',
      icon: 'companies',
    })
  }
  items.push({ label: company?.value?.name || '', icon: 'company' })
  return items
})

useSeoMeta({
  title: t('company.title.default', { company: company.value?.name }),
  description:
    company.value?.sponsorship?.shortDescription ||
    t('company.description.default', { company: company.value?.name }),
  ogTitle: company.value?.name || '',
  ogImage: company.value?.logoUrls?.m,
  ogImageAlt: company.value?.logoUrls?.alt || '',
})

useSchemaOrg(
  defineOrganization({
    name: company.value?.name || '',
    logo: company.value?.logoUrls?.m,
    email: company.value?.email || '',
    telephone: company.value?.phone || '',
    url: company.value?.website?.url || '',
  })
)
</script>
