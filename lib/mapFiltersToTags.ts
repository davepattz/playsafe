import { TAG_MAP } from "./tagMap";

export interface FilterGroups {
  gameTypes: string[];
  playStyles: string[];
  hidden: string[];
}

export interface MappedTags {
  includeTags: number[];
  excludeTags: number[];
}

export function mapFiltersToTags(filters: FilterGroups): MappedTags {
  const includeTags: number[] = [];
  const excludeTags: number[] = [];

  const addTags = (items: string[], target: number[]) => {
    items.forEach((label) => {
      const tagId = TAG_MAP[label];

      if (typeof tagId === "number" && !target.includes(tagId)) {
        target.push(tagId);
      }
    });
  };

  addTags(filters.gameTypes, includeTags);
  addTags(filters.playStyles, includeTags);
  addTags(filters.hidden, excludeTags);

  return { includeTags, excludeTags };
}
