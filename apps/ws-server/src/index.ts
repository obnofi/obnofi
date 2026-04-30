import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import * as Y from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import type { WebSocket } from 'ws'
import { prisma } from '@obnofi/db'

const MSG_SYNC = 0
const MSG_AWARENESS = 1
const PING_TIMEOUT = 30000
const PERSIST_DEBOUNCE = 1000

interface DocEntry {
  doc: Y.Doc
  awareness: awarenessProtocol.Awareness
  conns: Set<WebSocket>
  persistTimer: ReturnType<typeof setTimeout> | null
}

const docs = new Map<string, DocEntry>()

async function persistDoc(pageId: string, doc: Y.Doc) {
  const state = Buffer.from(Y.encodeStateAsUpdate(doc))
  await prisma.yjsDocument.upsert({
    where: { pageId },
    update: { state },
    create: { pageId, state },
  })
}

async function loadDoc(pageId: string, doc: Y.Doc): Promise<boolean> {
  try {
    const record = await prisma.yjsDocument.findUnique({ where: { pageId } })
    if (record) {
      Y.applyUpdate(doc, new Uint8Array(record.state))
      return true
    }
  } catch {
    // DB 오류 시 빈 문서로 계속
  }
  return false
}

async function getOrCreateDoc(docId: string): Promise<DocEntry> {
  let entry = docs.get(docId)
  if (!entry) {
    const doc = new Y.Doc()
    const awareness = new awarenessProtocol.Awareness(doc)

    entry = { doc, awareness, conns: new Set(), persistTimer: null }
    docs.set(docId, entry)

    await loadDoc(docId, doc)

    doc.on('update', (update: Uint8Array, origin: unknown) => {
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, MSG_SYNC)
      syncProtocol.writeUpdate(encoder, update)
      const msg = encoding.toUint8Array(encoder)
      entry!.conns.forEach((conn) => {
        if (conn !== origin && conn.readyState === 1 /* OPEN */) {
          conn.send(msg)
        }
      })

      if (entry!.persistTimer) {
        clearTimeout(entry!.persistTimer)
      }
      entry!.persistTimer = setTimeout(() => {
        persistDoc(docId, doc).catch(() => {})
        entry!.persistTimer = null
      }, PERSIST_DEBOUNCE)
    })

    awareness.on('update', ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
      const changedClients = [...added, ...updated, ...removed]
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, MSG_AWARENESS)
      encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients))
      const msg = encoding.toUint8Array(encoder)
      entry!.conns.forEach((conn) => {
        if (conn.readyState === 1) {
          conn.send(msg)
        }
      })
    })
  }
  return entry
}

function closeConn(entry: DocEntry, conn: WebSocket, docId: string) {
  if (!entry.conns.has(conn)) return
  entry.conns.delete(conn)

  if (entry.conns.size === 0) {
    if (entry.persistTimer) {
      clearTimeout(entry.persistTimer)
      entry.persistTimer = null
    }
    persistDoc(docId, entry.doc).catch(() => {})
    entry.doc.destroy()
    docs.delete(docId)
  }
}

function handleMessage(conn: WebSocket, entry: DocEntry, data: Uint8Array) {
  const decoder = decoding.createDecoder(data)
  const encoder = encoding.createEncoder()
  const msgType = decoding.readVarUint(decoder)

  switch (msgType) {
    case MSG_SYNC: {
      encoding.writeVarUint(encoder, MSG_SYNC)
      const syncMsgType = syncProtocol.readSyncMessage(decoder, encoder, entry.doc, conn)
      if (syncMsgType === syncProtocol.messageYjsSyncStep1) {
        conn.send(encoding.toUint8Array(encoder))
      } else if (encoding.length(encoder) > 1) {
        conn.send(encoding.toUint8Array(encoder))
      }
      break
    }
    case MSG_AWARENESS: {
      awarenessProtocol.applyAwarenessUpdate(entry.awareness, decoding.readVarUint8Array(decoder), conn)
      break
    }
  }
}

async function setupConnection(conn: WebSocket, docId: string) {
  conn.binaryType = 'arraybuffer'
  const entry = await getOrCreateDoc(docId)
  entry.conns.add(conn)

  conn.on('message', (rawData: ArrayBuffer | Buffer) => {
    const data = rawData instanceof ArrayBuffer ? new Uint8Array(rawData) : new Uint8Array(rawData.buffer, rawData.byteOffset, rawData.byteLength)
    handleMessage(conn, entry, data)
  })

  let pongReceived = true
  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      closeConn(entry, conn, docId)
      clearInterval(pingInterval)
      return
    }
    if (entry.conns.has(conn)) {
      pongReceived = false
      try {
        conn.ping()
      } catch {
        closeConn(entry, conn, docId)
        clearInterval(pingInterval)
      }
    }
  }, PING_TIMEOUT)

  conn.on('pong', () => { pongReceived = true })

  conn.on('close', () => {
    closeConn(entry, conn, docId)
    clearInterval(pingInterval)
  })

  // Send sync step 1
  {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MSG_SYNC)
    syncProtocol.writeSyncStep1(encoder, entry.doc)
    conn.send(encoding.toUint8Array(encoder))

    const awarenessStates = entry.awareness.getStates()
    if (awarenessStates.size > 0) {
      const aEncoder = encoding.createEncoder()
      encoding.writeVarUint(aEncoder, MSG_AWARENESS)
      encoding.writeVarUint8Array(aEncoder, awarenessProtocol.encodeAwarenessUpdate(entry.awareness, [...awarenessStates.keys()]))
      conn.send(encoding.toUint8Array(aEncoder))
    }
  }
}

// ---

const fastify = Fastify({ logger: true })
fastify.register(websocket)

fastify.register(async (fastify) => {
  fastify.get('/ws', { websocket: true }, (socket, req) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
    const docId = url.searchParams.get('docId') ?? 'default'
    setupConnection(socket as unknown as WebSocket, docId).catch((err) => {
      fastify.log.error(err)
      socket.close()
    })
  })
})

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
