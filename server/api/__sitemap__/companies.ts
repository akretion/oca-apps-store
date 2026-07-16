import { defineSitemapEventHandler } from '#imports'
import { typesenseClient } from '#shared/utils/typesenseClient'
import {
  CompanyService
} from '~~/services'

/**
 * return all companies urls for sitemap
 * see nuxt.config.ts for sitemap configuration
 */
export default defineSitemapEventHandler(async () => {
  const config = useRuntimeConfig()?.public?.search || {}
  const client = await typesenseClient(config.url, config.key)
  const searchIndexes = config.indices
  const isoLocale = 'en'
  const companyService = new CompanyService(
    isoLocale,
    client,
    searchIndexes.companies,
  )
  const companiesUrls = await companyService.sitemapsEntries()
  return companiesUrls
})