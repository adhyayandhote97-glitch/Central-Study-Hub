import Fuse from "fuse.js";
import type { Resource } from "@/types/resource";

const SEARCH_KEYS: { name: keyof Resource | string; weight: number }[] = [
  { name: "title", weight: 3 },
  { name: "description", weight: 1 },
  { name: "teacher", weight: 1.5 },
  { name: "uploader", weight: 1 },
  { name: "subjectName", weight: 1.5 },
  { name: "topic", weight: 1.5 },
  { name: "tags", weight: 2 },
];

export function createResourceSearchIndex(resources: Resource[]): Fuse<Resource> {
  return new Fuse(resources, {
    keys: SEARCH_KEYS,
    threshold: 0.3,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
}

export function searchResources(index: Fuse<Resource>, query: string): Resource[] {
  if (!query.trim()) return [];
  return index.search(query).map((result) => result.item);
}
