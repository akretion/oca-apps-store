import { Client } from 'typesense'
import {
  CategoryService,
  ModuleService,
  PersonService,
  CompanyService
} from '~~/services'

import type {
  ServiceList as ServiceList,
  SearchConfig
} from './types/config'

declare global {
  interface Shopinvader {
    services: ShopinvaderServiceList
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ShopinvaderServiceList extends ServiceList { }
}

declare module '#app' {
  interface NuxtApp {
    $shopinvader: Shopinvader
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $services: ServiceList
  }
}
let sharedHttpAgent: any
let sharedHttpsAgent: any
/*
 * This plugin is used to initialize all the services used in the app.
 * It also provides the fetchers to fetch data from the ERP and Search Engine.
 */
export default defineNuxtPlugin({
  name: 'services-plugin',
  async setup(nuxtApp) {
    if (import.meta.server) {
      const { Agent: HttpAgent } = await import('node:http')
      const { Agent: HttpsAgent } = await import('node:https')
      sharedHttpAgent ??= new HttpAgent({ keepAlive: true, maxSockets: 50 })
      sharedHttpsAgent ??= new HttpsAgent({ keepAlive: true, maxSockets: 50 })
    }
    const config = useRuntimeConfig()?.public?.search as SearchConfig
    if (
      !config
      || !config.url
    ) {
      throw new Error('No shopinvader search config found')
    }

    // Shortcuts to data
    const i18nOptions: any = nuxtApp.$i18n || {}
    const isoLocale: string
      = i18nOptions?.localeProperties?.value?.language
      || i18nOptions?.localeProperties?.value?.iso // For nuxt-i18n < 7
      || 'en'

    const searchBaseUrl = config.url
    const searchIndexes = config.indices
    const searchKey = config.key

    /* TypeSense client initialization */
    const url = new URL(searchBaseUrl)
    const path = url.pathname === '/' ? '' : url.pathname
    const client = new Client({
      nodes: [
        {
          host: url.hostname,
          path,
          port: url.port ? parseInt(url.port) : 443,
          protocol: url.protocol.replace(':', ''),
        },
      ],
      apiKey: searchKey,
      connectionTimeoutSeconds: 2,
      ...(import.meta.server && {
        httpAgent: sharedHttpAgent,
        httpsAgent: sharedHttpsAgent,
      }),
    })

    // Create all other services
    const services: ShopinvaderServiceList = {
      categories: new CategoryService(
        isoLocale,
        client,
        searchIndexes.categories,
      ),
      persons: new PersonService(
        isoLocale,
        client,
        searchIndexes.persons,
      ),
      companies: new CompanyService(
        isoLocale,
        client,
        searchIndexes.companies,
      ),
      modules: new ModuleService(
        isoLocale,
        client,
        searchIndexes.modules,
      )
    }
    // Init all services when the app is mounted
    // -----------------------------------------
    if (services) {
      // Init services in the order if the initSeq attribute
      const orderedServiceList = Object.values(services).sort(
        (a, b) => a?.initSeq - b?.initSeq,
      )
      for (const service of orderedServiceList) {
        if (service?.init) {
          await service.init(services)
        }
      }
    }


    // Provide the services and fetchers to the app
    return {
      provide: {
        services
      },
    }
  }
})
