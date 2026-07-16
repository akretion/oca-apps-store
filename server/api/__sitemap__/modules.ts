import { defineSitemapEventHandler } from '#imports'
import { typesenseClient } from '#shared/utils/typesenseClient'

import {
  ModuleService,
} from '~~/services'

/**
 * return all modules urls for sitemap
 * see nuxt.config.ts for sitemap configuration
 */
export default defineSitemapEventHandler(async () => {
  const config = useRuntimeConfig()?.public?.search || {}
  const client = await typesenseClient(config.url, config.key)

  const searchIndexes = config.indices
  const isoLocale = 'en'
  const modulesService = new ModuleService(
    isoLocale,
    client,
    searchIndexes.modules,
  )
  const modulesUrls = await modulesService.sitemapsEntries()
  return modulesUrls
})