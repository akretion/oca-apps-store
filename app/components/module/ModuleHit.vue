<template>
  <UCard
    v-if="module"
    :ui="{
      root: ui?.root,
      body: ui?.body,
      header: ui?.header,
      footer: ui?.footer,
    }"
  >
    <template #header>
      <div
        class="fit flex max-w-full items-center gap-4"
        @click="() => goToModule()"
      >
        <ModuleImage :module="module" class="min-w-16" />
        <div
          class="flex flex-col items-start justify-start gap-1 overflow-hidden"
        >
          <ProseH3
            class="my-0 line-clamp-2 font-heading text-lg leading-6 font-semibold text-primary lg:text-lg"
          >
            <NuxtLink :to="`/modules/${module.urlKey}`" @click.stop>
              <span v-if="highlights?.name" v-html="highlights.name" />
              <template v-else>
                {{ removeLastWord(module.name) }}
                <span class="text-secondary-500">
                  {{ getLastWord(module.name) }}
                </span>
              </template>
            </NuxtLink>
          </ProseH3>
          <div
            v-html="highlights?.techname || module?.techname"
            class="w-full flex-1 text-sm break-all text-muted"
          />
          <div class="flex flex-wrap items-center gap-2">
            <NuxtLink
              v-if="module?.repository?.category?.name"
              @click.stop
              :to="`/${module.repository.category.urlKey}`"
            >
              <UBadge
                v-if="module?.repository?.category?.name"
                color="secondary"
                variant="outline"
                size="sm"
                class="rounded-full"
                @click.stop
                :to="`/${module.repository.category.urlKey}`"
              >
                <span
                  v-html="
                    highlights?.category || module.repository.category.name
                  "
                />
              </UBadge>
            </NuxtLink>
            <UBadge
              v-if="module?.mustHave"
              color="success"
              variant="outline"
              size="sm"
              class="mt-1 rounded-full"
              icon="lucide:check"
              :label="t('modules.filters.must_have')"
            />
            <div
              v-if="module?.repository?.name"
              class="flex items-center gap-1 text-sm"
            >
              <UIcon name="repository" />
              <div
                class="line-clamp-1"
                v-html="highlights?.repository || module?.repository?.name"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
    <div class="flex flex-1 flex-col gap-y-1 pt-2">
      <div class="h-full flex-1" @click="() => goToModule()">
        <p
          v-if="module?.summary"
          class="line-clamp-3 text-sm text-gray-500 dark:text-gray-400"
          v-html="highlights?.summary || module?.summary"
        />
      </div>
      <div
        v-if="highlights?.complement"
        v-html="`... ${highlights.complement}...`"
        class="border-l-2 border-l-muted py-1 pl-2 text-xs text-dimmed"
        @click="() => goToModule()"
      />

      <ModuleSerieList
        :module-grouped="moduleGrouped"
        size="sm"
        class="pt-3"
        :limit="5"
        @select="(serie) => goToModule(serie)"
      />
    </div>
    <div class="flex items-center justify-between" @click="() => goToModule()">
      <div class="flex items-center">
        <UAvatarGroup v-if="module?.maintainers?.length" :max="8" size="sm">
          <UTooltip
            v-for="maintainer in module.maintainers"
            :key="maintainer.name"
          >
            <template #content>
              <ULink :to="`/${maintainer.urlKey}`">
                {{ t('modules.maintainer.title') }}
                {{ maintainer.name }}
              </ULink>
              <USeparator orientation="vertical" />
              <UButton
                variant="ghost"
                icon="github"
                size="xs"
                :to="`https://github.com/${maintainer.username}`"
                :label="maintainer.username"
                target="_blank"
              />
            </template>
            <UAvatar
              :key="maintainer.name"
              :alt="maintainer.name"
              :text="maintainer.name"
              :src="maintainer?.avatarUrl || ''"
              loading="lazy"
            />
          </UTooltip>
        </UAvatarGroup>
      </div>
      <div v-if="module?.githubUrl" class="flex items-center gap-1">
        <NuxtLink :to="module.githubUrl" target="_blank">
          <UIcon
            name="github"
            class="mr-1 p-2 text-gray-900 not-only:inline-block"
            width="32"
            height="32"
          />
        </NuxtLink>
      </div>
    </div>
  </UCard>
</template>
<script setup lang="ts">
import type { ModuleGroupedHit } from '~~/models'
import { twMerge } from 'tailwind-merge'
const props = defineProps<{
  moduleGrouped: ModuleGroupedHit
  variant?: 'grid' | 'list'
  ui?: {
    root?: string
    body?: string
    header?: string
    footer?: string
  }
}>()

interface Highlight {
  name?: string | null
  techname?: string | null
  summary?: string | null
  category?: string | null
  repository?: string | null
  complement?: string | null
}
const { t } = useI18n()
const localePath = useLocalePath()
const module = computed(
  () => props.moduleGrouped?.hits?.[props.moduleGrouped.hits.length - 1] || null
)
const ui = computed(() => {
  const ui = {
    root: 'w-full divide-none  max-sm:ring-0 dark:md:ring-neutral-800 max-sm:rounded-none max-sm:border-b max-sm:border-default max-md:pb-3 flex flex-col dark:[&_mark]:bg-secondary-700 [&_mark]:bg-secondary-200 [&_mark]:text-highlighted xl:min-h-64',
    body: 'p-3 sm:p-4 py-0 sm:py-0 pb-4 sm:pb-4 flex-1 flex flex-col gap-3',
    header: 'flex items-center gap-3 p-3 sm:p-4 ',
    footer: 'p-3 sm:p-4',
  }
  if (module.value?.urlKey) {
    ui.root = twMerge(
      ui.root,
      'hover:shadow-lg transition-shadow duration-200 cursor-pointer'
    )
  }
  if (props?.variant === 'list') {
    ui.root = twMerge(
      ui.root,
      'grid grid-cols-1 grid-cols-7 gap-4 p-4 ring-0 shadow-none  hover:shadow-none hover:bg-elevated rounded-none border-b border-neutral-100 dark:border-muted  xl:min-h-38'
    )
    ui.header = twMerge(ui.header, 'col-span-3 flex-col items-start gap-2')
    ui.body = twMerge(ui.body, 'col-span-4')
    ui.footer = twMerge(ui.footer, '')
  }
  return {
    root: twMerge(ui.root, props.ui?.root || ''),
    body: twMerge(ui.body, props.ui?.body || ''),
    header: twMerge(ui.header, props.ui?.header || ''),
    footer: twMerge(ui.footer, props.ui?.footer || ''),
  }
})

const goToModule = (serie?: string) => {
  if (!module.value?.urlKey) return
  let url = `/modules/${module.value.urlKey}`
  if (serie) {
    url += `?serie=${serie}`
  }
  navigateTo(url)
}
const highlights = computed<Highlight>(() => {
  if (!module?.value) return null
  const highlights: any = module.value?.highlights || {}
  const labels: Highlight = {
    summary: highlights?.summary?.snippet || null,
    name: highlights?.name?.snippet || null,
    category: highlights?.repo?.category?.name?.snippet || null,
    repository: highlights?.repo?.name?.snippet || null,
    techname: highlights?.techname?.snippet || null,
    complement: null,
  }
  // if all labels are null, return null to avoid rendering empty highlights
  if (Object.values(labels).every((value) => value === null)) {
    return {
      complement:
        highlights?.description?.snippet ||
        highlights?.readme_fragments?.usage?.snippet ||
        null,
    }
  }
  return labels
})
</script>
