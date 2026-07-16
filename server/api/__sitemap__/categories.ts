import { defineSitemapEventHandler } from '#imports'
import { typesenseClient } from '#shared/utils/typesenseClient'
import {
  CategoryService
} from '~~/services'

/**
 * return all categories urls for sitemap
 * see nuxt.config.ts for sitemap configuration
 */
export default defineSitemapEventHandler(async () => {
  const config = useRuntimeConfig()?.public?.search || {}
  const client = await typesenseClient(config.url, config.key)
  const searchIndexes = config.indices
  const isoLocale = 'en'
  const categoryService = new CategoryService(
    isoLocale,
    client,
    searchIndexes.categories,
  )
  const categoriesUrls = await categoryService.sitemapsEntries()
  return categoriesUrls
})