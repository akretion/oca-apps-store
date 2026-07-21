<template>
  <div v-if="person">
    <UBreadcrumb :items="breadCrumb" class="mt-8 mb-6" />
    <USeparator />
    <div class="py-8">
      <PersonHeroBanner :person="person" />
    </div>
    <div class="relative pt-14 pb-1 md:pt-22 md:pb-22">
      <div
        class="absolute top-0 left-1/2 -z-10 h-[100%] w-screen -translate-x-1/2 -skew-y-3 transform bg-secondary-50 dark:bg-primary-600"
      />
      <div v-if="displayPersonGroups" class="d-block mx-w-sm mx-auto">
        <PersonGroups :person="person" />
      </div>
      <div>
        <UEmpty
          v-if="!displayPersonGroups"
          :title="t('community.person.cta.groupsEmptyTitle')"
          :description="t('community.person.cta.groupsDescription')"
          variant="naked"
          :ui="{
            title: 'text-xl',
            root: 'min-h-64',
          }"
          :actions="[
            {
              label: t('community.person.cta.ctaGroupsLabel'),
              icon: 'i-lucide-user-plus',
              color: 'secondary',
              to: 'https://odoo-community.org/working-groups',
              target: '_blank',
            },
          ]"
        >
          <template #leading>
            <UAvatarGroup size="xl">
              <UAvatar src="/logo-192.png" alt="Oca logo" loading="lazy" />
            </UAvatarGroup>
          </template>
        </UEmpty>
      </div>
    </div>
    <UPageSection
      :title="t('community.person.cta.getInvolvedTitle')"
      :description="t('community.person.cta.getInvolvedDescription')"
      :links="getInvolvedLinks"
      :ui="{
        links: 'md:flex-row ',
      }"
    />
    <PersonModulesMaintained :person="person" />
  </div>
</template>
<script lang="ts" setup>
const { t } = useI18n()
import type { Person } from '~/models'

const person = ref<Person | null>(null)
const urlParams = useRoute().params
const route = useRoute()

const personService = useService('persons')
const breadCrumb = computed(() => {
  const items: any = [
    {
      label: t('nav.community.title'),
      to: '/community',
      icon: 'community',
    },
  ]
  items.push({ label: person?.value?.name || '', icon: 'person' })
  return items
})

const url = computed(() => {
  if (person.value) {
    return `${useRuntimeConfig().public.baseUrl}/community/${person.value.urlKey}`
  }
  return ''
})

useSeoMeta({
  title: person.value?.name || '',
  ogTitle: person.value?.name || '',
  ogImage: person.value?.logoUrls?.l,
  ogImageAlt: person.value?.name || '',
})

useSchemaOrg(
  definePerson({
    name: person.value?.name || '',
    description: person.value?.summary || '',
    image: person.value?.logoUrls?.l,
    url: url.value,
  })
)

const getPersonByUrlKey = async () => {
  const currentUrl = `community/${urlParams.handle?.[0]}`
  const res = await personService.getPersonByUrlKey({}, currentUrl as string)
  return res
}

const { data } = await useAsyncData<Person>(
  `person-${route.fullPath}`,
  getPersonByUrlKey,
  {
    watch: [route],
  }
)

if (data.value) {
  person.value = data.value
  if (route.path !== `/${person.value?.urlKey}`) {
    // redirect to the canonical URL if the path doesn't match the  URL
    navigateTo(`/${person.value?.urlKey}`, {
      redirectCode: 301,
    })
  }
} else {
  throw createError({
    statusCode: 404,
    statusMessage: t('person.notFound'),
    fatal: true,
  })
}
person.value = data.value || null

const displayPersonGroups = computed(() => {
  if (
    person.value.pscList.length > 0 ||
    person.value.workGroupList.length > 0
  ) {
    return true
  } else {
    return false
  }
})

const getInvolvedLinks = ref<ButtonProps[]>([
  {
    label: t('community.person.cta.ctaBecomeMemberLabel'),
    to: 'https://odoo-community.org/get-involved/become-a-member',
    color: 'warning',
    variant: 'subtle',
    trailingIcon: 'i-lucide-arrow-right',
    ui: {
      base: 'w-full md:w-auto',
      label: 'text-center mx-auto',
    },
  },
  {
    label: t('community.person.cta.ctaGroupsLabel'),
    to: 'https://odoo-community.org/working-groups',
    trailingIcon: 'i-lucide-arrow-right',
    color: 'primary',
    variant: 'subtle',
    ui: {
      base: 'w-full md:w-auto',
      label: 'text-center mx-auto',
    },
  },
  {
    label: t('community.person.cta.CtaContributorsLabel'),
    to: 'https://www.odoo-community.org/get-involved/contribute',
    color: 'neutral',
    variant: 'subtle',
    trailingIcon: 'i-lucide-arrow-right',
    ui: {
      base: 'w-full md:w-auto',
      label: 'text-center mx-auto',
    },
  },
  {
    label: t('community.person.cta.CtaCrowdfundingLabel'),
    to: 'https://odoo-community.org/crowdfunding',
    color: 'secondary',
    variant: 'subtle',
    trailingIcon: 'i-lucide-arrow-right',
    ui: {
      base: 'w-full md:w-auto',
      label: 'text-center mx-auto',
    },
  },
])
</script>
<style scoped>
.background-style::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  right: -50%;
  bottom: 0;
  background-position: center;
  background-repeat: no-repeat;
  z-index: -1;
  background-color: #fffbf5;
}
</style>
