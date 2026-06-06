"use client";

import { useEffect, useState } from "react";
import { patchGroveCell } from "@/lib/groveCatalogApi";
import { patchCachedPageTitle } from "@/lib/page/pageStoreSync";
import { useGroveCatalogStore } from "@/store/useGroveCatalogStore";
import type { Database, Page, PropertyValue, PropertyValueData } from "@obnofi/types";

interface AncestorPage {
  id: string;
  title: string;
  icon?: string | null;
}

export function useGroveSideTabPage(pageId: string | null, isOpen: boolean) {
  const patchGrovePageTitle = useGroveCatalogStore(
    (state) => state.patchGrovePageTitle
  );
  const patchGroveSeedTitle = useGroveCatalogStore(
    (state) => state.patchGroveSeedTitle
  );
  const patchGroveCellValue = useGroveCatalogStore(
    (state) => state.patchGroveCellValue
  );
  const [page, setPage] = useState<Page | null>(null);
  const [database, setDatabase] = useState<Database | null>(null);
  const [rowPropertyValues, setRowPropertyValues] = useState<PropertyValue[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [ancestors, setAncestors] = useState<AncestorPage[]>([]);

  useEffect(() => {
    if (!isOpen || !pageId) {
      setPage(null);
      setDatabase(null);
      setRowPropertyValues([]);
      return;
    }

    let isActive = true;
    setIsLoadingPage(true);

    Promise.all([
      fetch(`/api/pages/${pageId}`),
      fetch(`/api/pages/${pageId}/ancestors`),
    ])
      .then(async ([pageResponse, ancestorsResponse]) => {
        if (!isActive) {
          return;
        }

        const nextPage = pageResponse.ok ? ((await pageResponse.json()) as Page | null) : null;
        const ancestorsData = ancestorsResponse.ok ? ((await ancestorsResponse.json()) as AncestorPage[]) : [];

        setPage(nextPage);
        setAncestors(ancestorsData);
        setDatabase(null);
        setRowPropertyValues(nextPage?.propertyValues ?? []);

        if (nextPage?.parentDatabaseId) {
          const cachedDatabasePage = Object.values(
            useGroveCatalogStore.getState().grovePages
          ).find(
            (grovePage) => grovePage.database.id === nextPage.parentDatabaseId
          );

          if (cachedDatabasePage) {
            setDatabase(cachedDatabasePage.database);
            return;
          }

          const databaseResponse = await fetch(
            `/api/databases/${nextPage.parentDatabaseId}?view=schema`
          );
          if (!isActive || !databaseResponse.ok) {
            return;
          }

          const nextDatabase = (await databaseResponse.json()) as Database;
          setDatabase(nextDatabase);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingPage(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [isOpen, pageId]);

  const handlePageTitleChange = async (title: string) => {
    if (!page) {
      return;
    }

    const previousTitle = page.title;
    const parentDatabasePageId = database?.pageId ?? null;
    const nextPage = { ...page, title };

    setPage(nextPage);
    patchCachedPageTitle(page.id, title);

    if (page.type === "database") {
      patchGrovePageTitle(page.id, title);
    }

    if (parentDatabasePageId) {
      patchGroveSeedTitle(parentDatabasePageId, page.id, title);
    }

    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) {
        throw new Error("Failed to update page title");
      }

      const savedPage = (await response.json()) as Page;
      setPage(savedPage);
      patchCachedPageTitle(savedPage.id, savedPage.title);

      if (savedPage.type === "database") {
        patchGrovePageTitle(savedPage.id, savedPage.title);
      }

      if (parentDatabasePageId) {
        patchGroveSeedTitle(parentDatabasePageId, savedPage.id, savedPage.title);
      }
    } catch {
      setPage({ ...page, title: previousTitle });
      patchCachedPageTitle(page.id, previousTitle);

      if (page.type === "database") {
        patchGrovePageTitle(page.id, previousTitle);
      }

      if (parentDatabasePageId) {
        patchGroveSeedTitle(parentDatabasePageId, page.id, previousTitle);
      }
    }
  };

  const handlePageContentUpdate = async (nextContent: object) => {
    if (!page) {
      return;
    }

    await fetch(`/api/pages/${page.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: nextContent }),
    });
  };

  const handlePropertyValueChange = async (
    propertyId: string,
    value: PropertyValueData
  ) => {
    if (!page || !database) {
      return;
    }

    const optimisticValue: PropertyValue = {
      id: `side-tab:${page.id}:${propertyId}`,
      pageId: page.id,
      propertyId,
      columnId: propertyId,
      value,
    };

    setRowPropertyValues((current) => {
      const existingIndex = current.findIndex(
        (propertyValue) =>
          propertyValue.propertyId === propertyId ||
          propertyValue.columnId === propertyId
      );

      if (existingIndex === -1) {
        return [...current, optimisticValue];
      }

      return current.map((propertyValue, index) =>
        index === existingIndex
          ? { ...propertyValue, value }
          : propertyValue
      );
    });
    patchGroveCellValue(database.pageId, page.id, propertyId, value);

    try {
      const savedValue = await patchGroveCell(page.id, propertyId, value);
      if (savedValue) {
        setRowPropertyValues((current) => {
          const existingIndex = current.findIndex(
            (propertyValue) =>
              propertyValue.propertyId === propertyId ||
              propertyValue.columnId === propertyId
          );

          if (existingIndex === -1) {
            return [...current, savedValue];
          }

          return current.map((propertyValue, index) =>
            index === existingIndex ? savedValue : propertyValue
          );
        });
        patchGroveCellValue(database.pageId, page.id, propertyId, savedValue);
      }
    } catch {
      const pageResponse = await fetch(`/api/pages/${page.id}`);
      if (pageResponse.ok) {
        const nextPage = (await pageResponse.json()) as Page;
        setPage(nextPage);
        setRowPropertyValues(nextPage.propertyValues ?? []);
      }
    }
  };

  return {
    page,
    database,
    rowPropertyValues,
    isLoadingPage,
    ancestors,
    handlePageTitleChange,
    handlePageContentUpdate,
    handlePropertyValueChange,
  };
}
