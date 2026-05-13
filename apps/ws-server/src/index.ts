import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import type { WebSocket } from 'ws'
import { setupConnection } from './collaboration/connection.js'
import { checkPageAccess } from './collaboration/access.js'

const fastify = Fastify({ logger: true })
// Yjs 바이너리 업데이트는 압축 효과가 낮고 CPU 비용만 높아서 비활성화
fastify.register(websocket, { options: { perMessageDeflate: false } })

function parseCookies(cookieHeader: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim())
  }
  return out
}

fastify.register(async (fastify) => {
  fastify.get('/ws', { websocket: true }, (socket, req) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
    const docId = url.searchParams.get('docId') ?? 'default'
    const cookies = parseCookies(req.headers.cookie ?? '')
    const sessionToken =
      cookies['__Secure-next-auth.session-token'] ??
      cookies['next-auth.session-token'] ??
      null

    checkPageAccess(docId, sessionToken)
      .then((allowed) => {
        if (!allowed) {
          socket.close(4403, 'Forbidden')
          return
        }
        return setupConnection(socket as unknown as WebSocket, docId)
      })
      .catch((err) => {
        fastify.log.error(err)
        socket.close()
      })
  })
})

fastify.listen({ port: 3001, host: '0.0.0.0' }).catch((err) => {
  fastify.log.error(err)
  process.exit(1)
})
