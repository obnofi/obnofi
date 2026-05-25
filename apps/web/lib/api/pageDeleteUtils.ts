import { prisma } from "@obnofi/db";

type TxClient = Parameters<Parameters<(typeof prisma)["$transaction"]>[0]>[0];

export async function collectPageSubtreeIds(
  tx: TxClient,
  rootPageId: string
): Promise<{ pageIds: Set<string>; databaseIds: Set<string> }> {
  const pageIds = new Set<string>([rootPageId]);
  const databaseIds = new Set<string>();
  let frontier = [rootPageId];

  while (frontier.length > 0) {
    const [children, databases] = await Promise.all([
      tx.page.findMany({ where: { parentId: { in: frontier } }, select: { id: true } }),
      tx.database.findMany({ where: { pageId: { in: frontier } }, select: { id: true } }),
    ]);

    const nextFrontier: string[] = [];
    for (const child of children) {
      if (!pageIds.has(child.id)) {
        pageIds.add(child.id);
        nextFrontier.push(child.id);
      }
    }

    const newDbIds = databases.map((db) => db.id).filter((id) => !databaseIds.has(id));
    for (const id of newDbIds) databaseIds.add(id);

    if (newDbIds.length > 0) {
      const specimens = await tx.page.findMany({
        where: { parentDatabaseId: { in: newDbIds } },
        select: { id: true },
      });
      for (const s of specimens) {
        if (!pageIds.has(s.id)) {
          pageIds.add(s.id);
          nextFrontier.push(s.id);
        }
      }
    }

    frontier = nextFrontier;
  }

  return { pageIds, databaseIds };
}

export async function cascadeDeletePages(
  tx: TxClient,
  pageIds: Set<string>,
  databaseIds: Set<string>
): Promise<void> {
  const ids = Array.from(pageIds);

  await Promise.all([
    tx.page.updateMany({ where: { parentId: { in: ids } }, data: { parentId: null } }),
    databaseIds.size > 0
      ? tx.page.updateMany({
          where: { parentDatabaseId: { in: Array.from(databaseIds) } },
          data: { parentDatabaseId: null },
        })
      : Promise.resolve(),
    tx.comment.updateMany({
      where: { pageId: { in: ids }, parentId: { not: null } },
      data: { parentId: null },
    }),
    tx.file.updateMany({ where: { pageId: { in: ids } }, data: { pageId: null } }),
  ]);

  await Promise.all([
    tx.pageLink.deleteMany({
      where: { OR: [{ sourceId: { in: ids } }, { targetId: { in: ids } }] },
    }),
    tx.pageCollaborator.deleteMany({ where: { pageId: { in: ids } } }),
    tx.yjsDocument.deleteMany({ where: { pageId: { in: ids } } }),
    tx.propertyValue.deleteMany({ where: { pageId: { in: ids } } }),
  ]);

  await tx.comment.deleteMany({ where: { pageId: { in: ids } } });
  if (databaseIds.size > 0) {
    await tx.database.deleteMany({ where: { id: { in: Array.from(databaseIds) } } });
  }
  await tx.page.deleteMany({ where: { id: { in: ids } } });
}
