import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticateRequest } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";

interface PageParams {
  pageId: string;
}

interface PushSqlBody {
  sql: string;
  merge?: boolean;
}

// 간단한 SQL 파서 - CREATE TABLE 구문 파싱
interface ParsedTable {
  name: string;
  columns: {
    name: string;
    type: string;
    constraints: string[];
  }[];
}

function parseSql(sql: string): ParsedTable[] {
  const tables: ParsedTable[] = [];
  
  // CREATE TABLE 구문 추출 (간단한 파서)
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(([^;]+)\)/gi;
  let match;
  
  while ((match = createTableRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const columnsStr = match[2];
    
    const columns: ParsedTable["columns"] = [];
    
    // 컬럼 정의 파싱
    const columnLines = columnsStr.split(",").map(s => s.trim());
    
    for (const line of columnLines) {
      // CONSTRAINT, PRIMARY KEY, FOREIGN KEY 등 제외
      if (/^(CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|INDEX|UNIQUE|KEY)/i.test(line)) {
        continue;
      }
      
      // 컬럼 정의: name type constraints
      const colMatch = line.match(/^[`"']?(\w+)[`"']?\s+(\w+(?:\([^)]+\))?)\s*(.*)$/i);
      if (colMatch) {
        const constraints = colMatch[3]
          .split(/\s+/)
          .filter(s => s && !s.match(/^[`,')]/));
        
        columns.push({
          name: colMatch[1],
          type: colMatch[2].toUpperCase(),
          constraints: constraints.map(c => c.toUpperCase()),
        });
      }
    }
    
    tables.push({ name: tableName, columns });
  }
  
  return tables;
}

// 테이블을 ERD 노드 형식으로 변환
function tablesToERDNodes(tables: ParsedTable[], existingNodes: any[] = [], merge: boolean = false): any[] {
  const nodes: any[] = merge ? [...existingNodes] : [];
  const existingNames = new Set(nodes.map((n: any) => n.data?.tableName?.toLowerCase()));
  
  let yOffset = nodes.length * 250;
  
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    const tableNameLower = table.name.toLowerCase();
    
    // 병합 모드에서 기존 테이블이 있으면 업데이트
    if (merge && existingNames.has(tableNameLower)) {
      const existingIndex = nodes.findIndex((n: any) => n.data?.tableName?.toLowerCase() === tableNameLower);
      if (existingIndex >= 0) {
        nodes[existingIndex].data.columns = table.columns.map(col => ({
          name: col.name,
          type: col.type,
          constraints: col.constraints,
        }));
      }
      continue;
    }
    
    const node = {
      id: `table-${Date.now()}-${i}`,
      type: "tableNode",
      position: { x: 100 + (i % 3) * 350, y: yOffset + Math.floor(i / 3) * 250 },
      data: {
        tableName: table.name,
        columns: table.columns.map(col => ({
          name: col.name,
          type: col.type,
          constraints: col.constraints,
        })),
      },
    };
    
    nodes.push(node);
  }
  
  return nodes;
}

// ERD 노드를 SQL로 변환
function nodesToSql(nodes: any[]): string {
  const sqlLines: string[] = [];
  
  for (const node of nodes) {
    const tableName = node.data?.tableName;
    const columns = node.data?.columns || [];
    
    if (!tableName) continue;
    
    const columnDefs = columns.map((col: any) => {
      const constraints = col.constraints?.join(" ") || "";
      return `  \`${col.name}\` ${col.type}${constraints ? " " + constraints : ""}`;
    });
    
    sqlLines.push(`CREATE TABLE \`${tableName}\` (`);
    sqlLines.push(columnDefs.join(",\n"));
    sqlLines.push(`);`);
    sqlLines.push("");
  }
  
  return sqlLines.join("\n");
}

export async function dbDiagramRoutes(server: FastifyInstance) {
  // 인증 미들웨어 적용
  server.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    const isAuthenticated = await authenticateRequest(request, reply);
    if (!isAuthenticated) return;
  });

  // GET /blocks/db-diagram - DB 다이어그램 블록 목록
  server.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user!.id;

    // 사용자가 접근할 수 있는 캔버스 타입 페이지 중 DB 다이어그램이 있는 것 조회
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true },
    });
    const ownedWorkspaces = await prisma.workspace.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    const workspaceIds = [
      ...memberships.map((m) => m.workspaceId),
      ...ownedWorkspaces.map((w) => w.id),
    ];

    const pages = await prisma.page.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        type: "CANVAS",
      },
      select: {
        id: true,
        title: true,
        content: true,
        updatedAt: true,
        workspaceId: true,
      },
    });

    // content에서 db-diagram 블록 필터링
    const diagrams = pages
      .filter((page) => {
        const content = page.content as any;
        return content?.nodes?.some((node: any) => node.type === "dbDiagram" || node.type === "tableNode");
      })
      .map((page) => ({
        pageId: page.id,
        title: page.title,
        updatedAt: page.updatedAt,
        workspaceId: page.workspaceId,
      }));

    return reply.send({ diagrams });
  });

  // GET /blocks/db-diagram/:pageId/sql - ERD를 SQL로 낳기
  server.get("/:pageId/sql", async (request: FastifyRequest<{ Params: PageParams }>, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { pageId } = request.params;

    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        workspace: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
      },
    });

    if (!page) {
      return reply.status(404).send({ error: "Page not found" });
    }

    const content = page.content as any;
    const nodes = content?.nodes || [];
    const tableNodes = nodes.filter((node: any) => node.type === "tableNode" || node.data?.tableName);

    if (tableNodes.length === 0) {
      return reply.send({ sql: "", tables: 0, columns: 0 });
    }

    const sql = nodesToSql(tableNodes);
    const totalColumns = tableNodes.reduce((sum: number, node: any) => sum + (node.data?.columns?.length || 0), 0);

    return reply.send({
      sql,
      tables: tableNodes.length,
      columns: totalColumns,
    });
  });

  // POST /blocks/db-diagram/:pageId/sql - SQL을 ERD로 변환하여 저장
  server.post("/:pageId/sql", async (request: FastifyRequest<{ Params: PageParams; Body: PushSqlBody }>, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { pageId } = request.params;
    const { sql, merge = false } = request.body;

    if (!sql) {
      return reply.status(400).send({ error: "SQL is required" });
    }

    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        workspace: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId, role: { in: ["OWNER", "EDITOR"] } } } },
          ],
        },
      },
      select: {
        id: true,
        content: true,
      },
    });

    if (!page) {
      return reply.status(404).send({ error: "Page not found or access denied" });
    }

    // SQL 파싱
    const tables = parseSql(sql);

    if (tables.length === 0) {
      return reply.status(400).send({ error: "No valid CREATE TABLE statements found" });
    }

    // 기존 content 가져오기
    const content = (page.content as any) || { nodes: [], edges: [] };
    const existingNodes = content.nodes || [];

    // 테이블을 ERD 노드로 변환
    const newNodes = tablesToERDNodes(tables, existingNodes, merge);

    // content 업데이트
    const updatedContent = {
      ...content,
      nodes: newNodes,
    };

    await prisma.page.update({
      where: { id: pageId },
      data: {
        content: updatedContent,
        lastEditedBy: userId,
      },
    });

    const totalColumns = tables.reduce((sum, t) => sum + t.columns.length, 0);

    return reply.send({
      success: true,
      tables: tables.length,
      columns: totalColumns,
      message: `${tables.length}개 테이블, ${totalColumns}개 컬럼이 업데이트되었습니다.`,
    });
  });
}
