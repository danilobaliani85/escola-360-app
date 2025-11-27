import { LibraryItem, LibraryItemType, LibraryContent } from "../types";

const LIBRARY_KEY = "escola360_library";

export const saveToLibrary = (
  type: LibraryItemType,
  title: string,
  content: LibraryContent,
  metadata: any
): LibraryItem => {
  const existingData = localStorage.getItem(LIBRARY_KEY);
  const library: LibraryItem[] = existingData ? JSON.parse(existingData) : [];

  const newItem: LibraryItem = {
    id: crypto.randomUUID(),
    type,
    title,
    createdAt: new Date().toISOString(),
    content,
    metadata,
  };

  library.unshift(newItem); // Add to top
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
  return newItem;
};

export const getLibraryItems = (): LibraryItem[] => {
  const data = localStorage.getItem(LIBRARY_KEY);
  return data ? JSON.parse(data) : [];
};

export const deleteLibraryItem = (id: string): void => {
  const existingData = localStorage.getItem(LIBRARY_KEY);
  if (!existingData) return;

  const library: LibraryItem[] = JSON.parse(existingData);
  const updatedLibrary = library.filter((item) => item.id !== id);
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(updatedLibrary));
};