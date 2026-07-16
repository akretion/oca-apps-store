import type {
  Category,
  CategoryChild,
  CategoryImage,
  CategoryImageSet,
  CategoryParent,
  CategoryResult,
} from '~~/models'
import { BaseServiceTypeSense } from '~~/services'
import type { SearchResponseHit } from 'typesense/lib/Typesense/Documents'
import type { SitemapUrlInput } from '@nuxtjs/sitemap'

interface CategorySchema {
  id: number
  url_key: string
}
export class CategoryService extends BaseServiceTypeSense {
  navCategories: Category[] | null = null
  hits(data: SearchResponseHit<CategorySchema>[]): Category[] {
    return data.map((hit: any) => this.jsonToModel(hit?.document))
  }

  async search(body: any): Promise<CategoryResult> {
    const result = await super.performSearch<CategorySchema>(body)
    const hits = this.hits(result?.hits) || []
    const total = result?.found || 0
    const aggregations = null
    return { hits, total, aggregations }
  }

  static fullTextQuery(q: string) {
    return {
      q,
      query_by: 'name',
    }
  }

  /**
   * @param field
   * @param value
   * @returns
   */
  find(field: string, value: string[] | number[]): Promise<CategoryResult> {
    const body = {
      q: '*',
      query_by: 'name',
      filter_by: `${field}:=[${value.join(',')}]`,
    }
    return this.search(body)
  }

  getByIds(ids: number[]): Promise<CategoryResult> {
    const body = {
      q: '*',
      query_by: 'name,description',
      filter_by: `id:=[${ids.join(',')}]`,
      per_page: ids.length,
    }
    return this.search(body)
  }

  getAll(maxSize = 100): Promise<CategoryResult> {
    const body = { q: '*', sort_by: 'name:asc', per_page: maxSize }
    return this.search(body)
  }

  async getByURLKey(urlKey: string): Promise<Category | null> {
    const result: CategoryResult = await this.find('url_key', [urlKey])
    if (result?.hits?.length > 0) {
      return result?.hits?.[0]
    }
    return null
  }

  async autocompleteSearch(
    query: string,
    limit: number,
  ): Promise<CategoryResult> {
    const body = {
      ...CategoryService.fullTextQuery(query),
      per_page: limit,
    }

    const response = await this.search(body)
    const hits = response?.hits || []
    const total = response?.total || 0
    return { hits, total }
  }

  async getNavCategories(): Promise<Category[]> {
    if (this.navCategories == null) {
      const result = await this?.search({
        per_page: 20,
        q: '*',
        filter_by: `level:=0`
      })
      this.navCategories = result?.hits || []
    }
    return this.navCategories || []
  }

  async getSubCategories(parentId: number): Promise<Category[]> {
    const result = await this?.search({
      per_page: 20,
      q: '*',
      filter_by: `parent.id:=${parentId}`,
    })
    return result?.hits || []
  }

  /**
   * Return the list of all persons url for sitemap generation
   * We use a loop with pagination to avoid issues with large number of entries
   */
  async sitemapsEntries(): Promise<SitemapUrlInput[]> {
    const size = 249
    const urls: SitemapUrlInput[] = []
    let page = 1
    let total = 0
    do {
      const res = await this.performSearch({
        q: '*',
        group_by: 'url_key',
        per_page: size,
        page,
        group_limit: 1,
        include_fields: 'url_key',
        enable_highlight_v1: false,
      })
      total = res?.found || 0
      const hits = res?.grouped_hits
      for (const hit of hits || []) {
        if (hit?.group_key?.[0]) {
          urls.push({
            loc: hit.group_key[0],
          })
        }
      }

      page++
    } while ((page - 1) * size < total)
    return urls || []
  }

  jsonToModel(json: CategorySchema): Category {
    return CategoryFactory.createCategory(json)
  }
}

export const CategoryFactory = {
  createCategory(json: any): Category {
    return {
      id: json.id,
      name: json.name,
      urlKey: json.url_key,
      shortDescription: json?.short_description,
      description: json?.description
    }
  }
}
