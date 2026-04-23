import { TAG_MAP } from "./tagMap";

export interface FilterGroups {
  gameTypes: string[];
  playStyles: string[];
  hidden: string[];
}

export interface MappedTags {
  gameTypeTags: number[];
  playStyleTags: number[];
  hiddenTags: number[];
}

export function mapFiltersToTags(filters: FilterGroups): MappedTags {
  const gameTypeTags: number[] = [];
  const playStyleTags: number[] = [];
  const hiddenTags: number[] = [];

  const addTags = (items: string[], target: number[]) => {
    items.forEach((label) => {
      const tagId = TAG_MAP[label];

      if (typeof tagId === "number" && !target.includes(tagId)) {
        target.push(tagId);
      }
    });
  };

  addTags(filters.gameTypes, gameTypeTags);
  addTags(filters.playStyles, playStyleTags);
  addTags(filters.hidden, hiddenTags);

  return { gameTypeTags, playStyleTags, hiddenTags };
}
