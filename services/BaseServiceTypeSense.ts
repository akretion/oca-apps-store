import { BaseServiceLocalized } from '~~/services'
import type { Client } from 'typesense'
import type {
  DocumentSchema,
  SearchResponse,
} from 'typesense/lib/Typesense/Documents'
import type {
  SearchParams,
} from 'typesense/lib/Typesense/Types'
import type { LocalizedIndex } from '~/plugins/services/types/config'

export class BaseServiceTypeSense extends BaseServiceLocalized {
  collectionByLocales: {
    [key: string]: string
  }
  collection: {
    [key: string]: string
  }
  client: Client
  constructor(
    isoLocale: string,
    client: Client,
    collectionByLocales: LocalizedIndex,
  ) {
    super(isoLocale)
    this.client = client
    this.collectionByLocales = collectionByLocales
    if (!this.collectionByLocales) {
      throw new Error('Typesense collection is required')
    }
    this.collection = this.setLocalizedCollectionName()
  }

  setLocalizedCollectionName() {
    return this.collectionByLocales?.['en'] || ''
  }

  // Change indexes' names to match the current locale
  override async changeLocale(isoLocale: string) {
    super.changeLocale(isoLocale)
    this.collection = this.setLocalizedCollectionName()
  }

  /**
   * Perform a multiple queries search on Typesense
   * @param queries
   * @returns
   */
  async performMultiSearch<T extends DocumentSchema>(
    queries: SearchParams<T>[] = [],
  ): Promise<{ results: SearchResponse<T>[] }> {
    try {
      const searches = queries.map(query => ({
        collection: this.collection,
        ...query,
      }))

      const res = await this.client.multiSearch.perform({
        searches,
      })
      if (res?.results?.[0]?.error) {
        console.error('Typesense error:', res.results[0].error)
        throw new Error(res.results[0].error)
      }
      return res
    }
    catch (error: any) {
      this.findFailureInTypesenseResponse(error?.data)
      throw error
    }
  }

  /**
   * Perform a search on a single collection
   * @param body
   * @returns
   */
  async performSearch<T extends DocumentSchema>(
    body: SearchParams<T>,
  ): Promise<SearchResponse<T> | null> {
    const res = await this.performMultiSearch<T>([body])
    return res?.results?.[0] || null
  }

  // Recursively search for 'failures' or 'failed_shards' fields somewhere deep in the response and concat errors from them
  findFailureInTypesenseResponse(response: any): string | null {
    if (!response) {
      return null
    }
    const searchFailures = (level: number, obj: any): string => {
      let errors = ''
      for (const key in obj) {
        if (key === 'failures' || key === 'failed_shards') {
          // if it's an array, concat all the messages
          if (Array.isArray(obj[key])) {
            errors += obj[key]
              .map((item: any) => `${item?.index}: ${item?.reason?.reason}`)
              .join('; ')
          }
          else {
            errors += JSON.stringify(obj[key])
          }
        }
        else if (level < 1 && typeof obj[key] === 'object') {
          // Go deeper only once for optimization
          errors += searchFailures(level + 1, obj[key])
        }
      }
      return errors
    }
    const res = searchFailures(0, response)
    return res || null
  }
}
