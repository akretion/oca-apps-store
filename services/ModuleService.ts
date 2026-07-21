import type {
  Module,
  ModuleMaintainer,
  ModuleGroupedHit,
  ModuleResult,
  FacetSearchParam,
  FacetSearchResult,
  Person,
  Company,
} from '~~/models'
import { BaseServiceTypeSense } from '~~/services'
import type { SearchResponseHit } from 'typesense/lib/Typesense/Documents'
import type { SitemapUrlInput } from '#sitemap/types'
import type { ModuleMaintainers, ModuleWithHighlight } from '~~/models/Module'

interface ModuleSchema {
  id: number
  techname: string
}

export class ModuleService extends BaseServiceTypeSense {
  navCategories: Module[] | null = null
  hits(data: SearchResponseHit<ModuleSchema>[]): Module[] {
    return data.map((hit: any) => this.jsonToModel(hit?.document))
  }
  groupedHits(groupedHits: any[]): ModuleGroupedHit[] {
    return groupedHits.map((group: any) => ({
      urlKey: group?.group_key?.[0] || '',
      hits:
        group?.hits.map((hit: any) => {
          if (hit?.highlights) {
            return this.jsonToModelWithHighlight(hit?.document, hit?.highlight)
          }
          return this.jsonToModel(hit?.document)
        }) || [],
    }))
  }

  /**
   * Find a module by its url key, which is the techname field in typesense.
   * @param urlKey The url key of the module
   * @param serie  (Odoo version) 
   * @returns 
   */
  async findByURLKey(
    urlKey: string,
    serie?: string
  ): Promise<ModuleGroupedHit | null> {
    let sortBy = 'serie:desc'
    if (serie) {
      sortBy = `_eval(serie:${serie}),${sortBy}`
    }
    const body: any = {
      q: '*',
      filter_by: `techname:=\`${urlKey}\``,
      group_by: 'techname',
      group_limit: 99,
      sort_by: sortBy,
    }
    const result = await super.performSearch(body)

    const groupedHits = this.groupedHits(result?.grouped_hits) || []

    return groupedHits?.[0] || null
  }

  /**
   * Find a module by one of its redirect url key, and return the module url key to perform a 301 redirection.
   * This is used to keep old urls working after a module has been renamed (and its techname changed) or to keep compatibility with old urls from the OCA website.
   * @param urlKey The url key to search in the redirect_url_key field of typesense, which is an array of strings.
   * @returns A single module that match the url key in its redirect_url_key field, or null if no module is found.
   */
  async findRedirectByURLKey(urlKey: string): Promise<Module[] | null> {
    const body: any = {
      q: urlKey,
      query_by: 'redirect_url_key',
      limit: 1,
    }
    const result = await super.performSearch(body)
    return this.hits(result?.hits) || []
  }

  async search(body: any): Promise<ModuleResult> {
    body = {
      ...{ q: '*', query_by: 'name' },
      ...body,
      group_by: 'techname',
      group_limit: 99,
    }
    const result = await super.performSearch<any>(body)
    const hits = this.groupedHits(result?.grouped_hits) || []
    const total = result?.found || 0
    return { hits, total }
  }

  async getModulesList(input: Module | Person): Promise<ModuleGroupedHit[]> {
    let filter = ''
    let found: ModuleGroupedHit | undefined
    let technicalNameList: string[] = []
    if ('dependencies' in input) {
      filter = input?.dependencies.map((dep) => `${dep}`).join(',')
      technicalNameList = input?.dependencies
    } else if ('modulesMaintainedIds' in input) {
      filter = input?.modulesMaintainedIds.map((dep) => `${dep}`).join(',')
      technicalNameList = input?.modulesMaintainedIds
    }

    const res = await this.search({
      filter_by: `techname:=[${filter}]`,
    })

    return (
      technicalNameList.map((dep) => {
        found = res?.hits.find((hit) => hit.urlKey === dep) || {
          urlKey: dep,
          hits: [
            ModuleFactory.createModule({
              name: dep,
              urlKey: null,
            }),
          ],
        }

        return found
      }) || []
    )
  }

  /**
   * Get modules that depend on a module
   * @param module 
   * @param queryString
   * @param page 
   * @param perPage 
   * @returns 
   */
  async getModuleUsedBy(
    module: Module,
    queryString: string,
    page: number,
    perPage: number
  ): Promise<ModuleResult> {
    const query: any = {
      filter_by: `dependencies:="${module.techname}"`,
      group_by: 'techname',
      page: page,
      per_page: perPage,
    }
    if (queryString) {
      query.q = queryString
      query.query_by = 'name'
    }
    const res = await this.search(query)
    return res
  }

  /**
   * get modules maintained by a person
   * 
   * @param person 
   * @param queryString 
   * @param page 
   * @param perPage 
   * @returns 
   */
  async getModulesMaintainedBy(
    person: Person,
    queryString: string,
    page: number,
    perPage: number
  ): Promise<ModuleResult> {
    const query: any = {
      filter_by: `maintainers.github_user:="${person.githubUsers[0]}"`,
      group_by: 'techname',
      page: page,
      per_page: perPage,
    }
    if (queryString) {
      query.q = queryString
      query.query_by = 'name'
    }
    const res = await this.search(query)
    return res
  }

  /**
   * Get modules created by an company, using the authors field in typesense to find modules where the company is mentioned as an author.
   * @param company 
   * @param queryString 
   * @param page 
   * @param perPage 
   * @returns 
   */
  async getModulesCreatedBy(
    company: Company,
    queryString: string,
    page: number,
    perPage: number
  ): Promise<ModuleResult> {
    const query: any = {
      filter_by: `authors.url_key:="${company.urlKey}"`,
      group_by: 'techname',
      page: page,
      per_page: perPage,
    }
    if (queryString) {
      query.q = queryString
      query.query_by = 'name'
    }
    const res = await this.search(query)
    return res
  }

  /**
   * Search for modules with facets, 
   * allowing to perform multi-searches 
   * to get facet counts and stats in the same time and modules results.
   * @param query 
   * @param facets 
   * @returns 
   */
  async facetSearch(
    query: any,
    facets: FacetSearchParam[]
  ): Promise<FacetSearchResult<ModuleGroupedHit>> {
    if (!query.sort_by) {
      delete query.sort_by
    }

    /** Build facet by query */
    let facetBy = facets.map((facet) => {
      if (facet.sortBy) {
        return `${facet.field}(sort_by: ${facet.sortBy})`
      }
      return facet.field
    })

    if (query?.facet_by) {
      if (Array.isArray(query.facet_by)) {
        facetBy = [...facetBy, ...query.facet_by]
      } else {
        facetBy = [...facetBy, ...query.facet_by.split(',')]
      }
    }

    /** Build filter by query */
    let filterBy = facets.reduce((acc, facet) => {
      if (facet.query) {
        acc.push(facet.query)
      }
      return acc
    }, [] as string[])

    if (query?.filter_by) {
      filterBy = [...filterBy, ...query.filter_by.split(' && ')]
    }

    if (query?.q !== '*' && query?.q && query?.sort_by) {
      delete query.sort_by
    }

    const queries = [
      {
        ...query,
        facet_by: facetBy.join(','),
        max_facet_values: 100,
        filter_by: filterBy.join(' && '),
        group_by: 'techname',
        group_limit: 99,
      },
    ]

    for (const facet of facets) {
      if (facet.query || facet.searchTerm) {
        const facetBy = facet.sortBy
          ? `${facet.field}(sort_by: ${facet.sortBy})`
          : facet.field
        let filterBy =
          queries[0]?.filter_by
            ?.split(' && ')
            .filter((f) => f !== facet.query)
            .join(' && ') || ''
        if (facet?.searchTerm) {
          const searchFilter = `${facet.field}:*${facet.searchTerm}*`
          filterBy = filterBy ? `${filterBy} && ${searchFilter}` : searchFilter
        }
        queries.push({
          ...query,
          filter_by: filterBy,
          facet_by: facetBy,
          group_by: 'techname',
          group_limit: 99,
          per_page: 0,
          max_facet_values: facet.perPage,
        })
      }
    }
    const { results } = await super.performMultiSearch<ModuleSchema>(queries)
    const groupedHits = results[0]?.grouped_hits || []
    return {
      hits: this.groupedHits(groupedHits) || [],
      found: results[0]?.found || 0,
      facets: facets.map((facet) => {
        const filterResults = results.findLast((res) =>
          res.facet_counts?.some((f: any) => f.field_name === facet.field)
        )
        const result =
          filterResults?.facet_counts?.find(
            (f: any) => f.field_name === facet.field
          ) || null
        return {
          field: facet.field,
          stats: result?.stats || {},
          items: result?.counts || [],
        }
      }),
    }
  }
  /**
   * Return the list of all modules url for sitemap generation
   * We use a loop with pagination to avoid issues with large number of entries
   */
  async sitemapsEntries(): Promise<SitemapUrlInput[]> {
    const size = 249
    const urls: SitemapUrlInput[] = []
    let page = 1
    let total = 0
    do {
      const res = await super.performSearch({
        q: '*',
        group_by: 'techname',
        per_page: size,
        page,
        group_limit: 1,
        include_fields: 'techname',
        enable_highlight_v1: false,
      })
      total = res?.found || 0
      const hits = res?.grouped_hits
      for (const hit of hits || []) {
        if (hit?.group_key?.[0]) {
          urls.push({
            loc: `/modules/${hit.group_key[0]}`,
          })
        }
      }

      page++
    } while ((page - 1) * size < total)

    return urls || []
  }

  jsonToModelWithHighlight(
    json: ModuleSchema,
    highlights: { field: string; value: string }[]
  ): ModuleWithHighlight {
    const module = this.jsonToModel(json)
    return {
      ...module,
      highlights,
    }
  }
  jsonToModel(json: ModuleSchema): Module {
    return ModuleFactory.createModule(json)
  }
}

export const ModuleFactory = {
  createModule(json: any): Module {
    let summary = json?.summary || ''
    if (!summary && json?.readme_fragments?.description) {
      summary = json.readme_fragments.description.substring(0, 300)
    }
    const module: Module = {
      id: json.id,
      name: json.name,
      iconUrl: json?.icon_url,
      urlKey: json?.techname,
      techname: json?.techname,
      repository: {
        url: json?.repo?.url,
        name: json?.repo?.name,
        description: json?.repo?.description,
        category: {
          name: json?.repo?.category?.name,
          urlKey: json?.repo?.category?.url_key,
        },
      },
      serie: json?.serie,
      version: json?.version,
      summary,
      license: json?.license,
      usedBy: json?.used_by || [],
      dependencies: json?.dependencies || [],
      maturity: json?.maturity,
      authors: this.createModuleAuthors(json?.authors || []),
      maintainers: this.createModuleMaintainers(json?.maintainers || []),
      publicURL: json?.public_url,
      runboatURL: json?.runboat_url,
      mustHave: json?.must_have,
      githubUrl: json?.github_url,
      readmeFragments: {
        description: json?.readme_fragments?.description,
        configure: json?.readme_fragments?.configure,
        contributors: json?.readme_fragments?.contributors,
        context: json?.readme_fragments?.context,
        credits: json?.readme_fragments?.credits,
        history: json?.readme_fragments?.history,
        install: json?.readme_fragments?.install,
        roadmap: json?.readme_fragments?.roadmap,
        usage: json?.readme_fragments?.usage,
      },
      bugTracker: {
        url: json?.bug_tracker?.url,
        instructions: json?.bug_tracker?.instructions,
      },
      popularity: json?.popularity,
      lastUpdate: json?.last_update ? new Date(json.last_update) : null,
    }

    return module
  },
  createModuleMaintainers(json: any[]): ModuleMaintainer[] {
    return json.map((p: any) => ({
      name: p.name,
      avatarUrl: p?.avatar_url || null,
      username: p?.github_user || null,
      urlKey: p?.url_key,
    })) as ModuleMaintainer[]
  },
  createModuleAuthors(json: any[]): [] {
    return json.map((p: any) => ({
      name: p.name,

      urlKey: p?.url_key,
    })) as []
  }
}
