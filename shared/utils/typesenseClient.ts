import { Client } from 'typesense'

/**
 * TypeSense client initialization
 * @param urlString 
 * @param apiKey 
 * @returns 
 */
export const typesenseClient = async (urlString: string, apiKey: string) => {
  let sharedHttpAgent: any
  let sharedHttpsAgent: any
  const url = new URL(urlString)
  const path = url.pathname === '/' ? '' : url.pathname
  if (import.meta.server) {
    const { Agent: HttpAgent } = await import('node:http')
    const { Agent: HttpsAgent } = await import('node:https')
    sharedHttpAgent ??= new HttpAgent({ keepAlive: true, maxSockets: 50 })
    sharedHttpsAgent ??= new HttpsAgent({ keepAlive: true, maxSockets: 50 })
  }
  const client = new Client({
    nodes: [
      {
        host: url.hostname,
        path,
        port: url.port ? parseInt(url.port) : 443,
        protocol: url.protocol.replace(':', ''),
      },
    ],
    apiKey,
    connectionTimeoutSeconds: 2,
    ...(import.meta.server && {
      httpAgent: sharedHttpAgent,
      httpsAgent: sharedHttpsAgent,
    }),
  })
  return client
}