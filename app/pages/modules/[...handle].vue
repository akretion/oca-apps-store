<template>
  <div v-if="module?.id" class="flex flex-col" :key="module.id">
    <div class="relative py-4 lg:pt-10 lg:pb-32">
      <div
        class="absolute top-0 left-1/2 -z-10 mx-auto h-[120%] w-screen -translate-x-1/2 transform bg-muted/50 content-['']"
      ></div>
      <div class="flex flex-col gap-y-3 lg:flex-row">
        <div class="lg:w-5/8 lg:pr-5">
          <UBreadcrumb :items="breadCrumb" class="mb-6 md:mt-8" />
          <USeparator />
          <div class="overflow-x-hidden pt-6 lg:max-w-xl xl:max-w-2xl">
            <div
              class="flex gap-4 overflow-hidden max-md:flex-col lg:items-center"
            >
              <ProseH1
                class="mb-2 break-after-auto text-2xl text-primary sm:mb-5 md:text-3xl lg:mt-10 lg:text-5xl xl:text-6xl"
              >
                {{ removeLastWord(module?.name) }}
                <span class="text-secondary-500">
                  {{ getLastWord(module?.name) }}
                </span>
              </ProseH1>
            </div>
            <NuxtLink
              v-if="module?.repository?.category?.name"
              @click.stop
              :to="`/${module.repository.category.urlKey}`"
            >
              <UBadge
                v-if="module?.repository?.category?.name"
                color="secondary"
                variant="soft"
                size="md"
                class="cursor-pointer"
                :label="module.repository.category.name"
                :to="`/${module.repository.category.urlKey}`"
              />
            </NuxtLink>
            <UBadge
              v-if="module.mustHave"
              color="success"
              variant="outline"
              size="sm"
              icon="lucide:check"
              class="ml-2 rounded-full"
              :label="t('modules.filters.must_have')"
            />

            <UContentToc
              class="md:hidden"
              :links="links"
              :default-open="false"
              color="primary"
            />
            <div id="description">
              <MDC
                v-if="module?.readmeFragments?.description"
                :value="module.readmeFragments.description"
              />
              <div v-else class="prose pb-10">{{ module?.summary }}</div>
            </div>
            <ModuleContext :module="module" id="context" />
            <USeparator
              v-if="module?.readmeFragments?.description"
              class="my-6"
            />
            <UFormField
              :label="t('modules.versions.available')"
              size="xl"
              id="series"
            >
              <ModuleSerieList
                v-if="moduleGrouped"
                :module-grouped="moduleGrouped"
                :selected-module="module"
                size="xl"
                @select="onChangeSerie"
              />
            </UFormField>
          </div>
        </div>
        <div class="relative lg:h-64 lg:w-4/8 xl:w-5/12" id="download">
          <ModuleDownload
            v-if="moduleGrouped"
            :module-grouped="moduleGrouped"
            :selected-module="module"
            class="mx-auto w-full max-w-2xl translate-y-7"
            @serie-change="onChangeSerie"
          />
        </div>
      </div>
    </div>
    <div class="relative mb-12 pt-12 pb-12 lg:py-16 xl:pt-18 xl:pb-10">
      <div
        class="absolute -top-3 left-1/2 -z-10 h-full w-screen -translate-x-1/2 -skew-y-3 transform bg-secondary-50 dark:bg-primary-500"
      />
      <div class="flex flex-col gap-2 lg:flex-row">
        <div class="flex flex-col gap-4">
          <div
            v-if="module?.readmeFragments?.install"
            class="flex-1 pb-10"
            id="install"
          >
            <ProseH2 class="mt-2 text-2xl text-secondary md:text-3xl">
              {{ t('modules.install.title') }}
            </ProseH2>
            <MDC :value="module.readmeFragments.install" />
          </div>
          <div
            v-if="module?.readmeFragments?.configure"
            class="flex-1"
            id="settings"
          >
            <ProseH2 class="mt-2 text-2xl text-info md:text-3xl">
              {{ t('modules.settings.title') }}
            </ProseH2>
            <MDC :value="module.readmeFragments.configure" />
          </div>
        </div>
        <div
          v-if="
            (module?.readmeFragments?.configure ||
              module?.readmeFragments?.install) &&
            module?.readmeFragments?.contributors
          "
          class="my-2 hidden lg:flex"
        >
          <USeparator orientation="vertical" class="mx-10 hidden lg:block" />
        </div>
        <div
          v-if="module?.readmeFragments?.contributors"
          class="min-w-sm lg:p-10"
          id="contributors"
        >
          <ProseH2 class="my-2 text-2xl text-secondary md:text-3xl">
            {{ t('modules.contributors.title') }}
          </ProseH2>
          <ModuleContributorList :module="module" class="mt-4 lg:mt-7" />
        </div>
      </div>
    </div>

    <ModuleUsage :module="module" id="usage" />
    <ModuleHistory :module="module" id="history" />
    <ModuleRoadMap :module="module" id="roadmap" />
    <ModuleMaintainer :module="module" id="maintainer" />
    <ModuleBugTracker :module="module" id="bugtracker" />
    <ModuleDependencies :module="module" id="dependencies" />
    <ModuleUsedBy :module="module" id="usedby" />
  </div>
</template>

<script lang="ts" setup>
import type { ContentTocLink } from '@nuxt/ui'
import type { ModuleGroupedHit, Module } from '~~/models'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const moduleService = useService('modules')
const { data: moduleGrouped, error } =
  await useAsyncData<ModuleGroupedHit | null>(
    `module-${route.params.handle}`,
    () =>
      moduleService.findByURLKey(
        route.params.handle as string,
        route?.query?.serie as string | undefined
      ),
    {
      watch: [() => route.path],
    }
  )

if (moduleGrouped.value == null || error.value) {
  throw createError({
    statusCode: error?.value ? 500 : 404,
    statusMessage: error?.value?.message || t('modules.notFound'),
    fatal: true,
  })
}

let selectedVersion = moduleGrouped.value?.hits?.[0]
if (route?.query?.serie) {
  selectedVersion =
    moduleGrouped.value?.hits.find((hit) => hit.serie === route.query.serie) ||
    selectedVersion
}
if (route.path !== `/modules/${selectedVersion?.techname}`) {
  // redirect to the canonical URL if the path doesn't match the selected version's techname
  navigateTo(`/modules/${selectedVersion?.techname}`, { redirectCode: 301 })
}

const module = ref<Module | null>(selectedVersion || null)
const image = computed(() => module.value?.iconUrl || '/oca-logo.png')
const breadCrumb = computed(() => {
  const items = [
    { label: t('nav.modules.title'), to: '/modules', icon: 'module' },
  ]
  if (module.value?.repository?.category?.name) {
    items.push({
      icon: 'category',
      label: module.value.repository.category.name,
      to: `/${module.value.repository.category.urlKey}`,
    })
  }
  items.push({
    label: module.value.name,
  })
  return items
})

useSeoMeta({
  title: module.value?.name || '',
  description: module.value?.summary || '',
  ogTitle: module.value?.name || '',
  ogDescription: module.value?.summary || '',
  ogImage: image.value,
  ogImageAlt: module.value?.name || '',
})

useSchemaOrg(
  defineSoftwareApp({
    name: module.value?.name || '',
    description: module.value?.summary || '',
    image: image.value,
    applicationCategory: 'DeveloperApplication',
    softwareHelp: module.value?.website || '',
    url: module.value?.website || '',
    softwareVersion: module.value?.serie || '',
    downloadUrl: module.value?.website || '',
    version: module.value?.version || '',
  })
)

const onChangeSerie = (serie: string) => {
  const found = moduleGrouped.value?.hits.find((hit) => hit.serie === serie)
  if (found) {
    module.value = found
    router.replace({
      query: {
        serie: found.serie,
      },
    })
  }
}
const links = computed<ContentTocLink[]>(() => {
  const readmeFragments = module?.value?.readmeFragments
  const sections = [
    {
      id: 'description',
      text: t('modules.description.title'),
    },
  ]

  if (readmeFragments?.context) {
    sections.push({
      id: 'context',
      text: t('modules.context.title'),
    })
  }
  if (readmeFragments?.install) {
    sections.push({
      id: 'install',
      text: t('modules.install.title'),
    })
  }
  if (readmeFragments?.configure) {
    sections.push({
      id: 'settings',
      text: t('modules.settings.title'),
    })
  }
  if (readmeFragments?.contributors) {
    sections.push({
      id: 'contributors',
      text: t('modules.contributors.title'),
    })
  }
  if (readmeFragments?.usage) {
    sections.push({
      id: 'usage',
      text: t('modules.usage.title'),
    })
  }
  if (readmeFragments?.history) {
    sections.push({
      id: 'history',
      text: t('modules.history.title'),
    })
  }
  if (readmeFragments?.roadmap) {
    sections.push({
      id: 'roadmap',
      text: t('modules.roadmap.title'),
    })
  }
  if (module.value?.maintainers && module.value?.maintainers?.length > 0) {
    sections.push({
      id: 'maintainer',
      text: t('modules.maintainer.title'),
    })
  }
  sections.push({
    id: 'bugtracker',
    text: t('modules.bugTracker.title'),
  })
  if (module.value?.dependencies && module.value?.dependencies?.length > 0) {
    sections.push({
      id: 'dependencies',
      text: t('modules.dependencies.title'),
    })
  }

  return sections
})
</script>
