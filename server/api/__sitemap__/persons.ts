import { defineSitemapEventHandler } from '#imports'
import { typesenseClient } from '#shared/utils/typesenseClient'
import {

  PersonService
} from '~~/services'

/**
 * return all persons urls for sitemap
 * see nuxt.config.ts for sitemap configuration
 */
export default defineSitemapEventHandler(async () => {
  const config = useRuntimeConfig()?.public?.search || {}
  const client = await typesenseClient(config.url, config.key)
  const searchIndexes = config.indices
  const isoLocale = 'en'
  const personService = new PersonService(
    isoLocale,
    client,
    searchIndexes.persons,
  )
  const personsUrls = await personService.sitemapsEntries()
  return personsUrls
})