import type { AgeGroupId } from "@/types/book";

export interface AgeGroup {
  id: AgeGroupId;
  label: string;
  ages: string;
  /** Guidance handed to the Story Director. */
  writingGuidance: string;
  wordsPerPage: [number, number];
}

export const AGE_GROUPS: Record<AgeGroupId, AgeGroup> = {
  toddler: {
    id: "toddler",
    label: "Toddler",
    ages: "2–4",
    writingGuidance:
      "Very short, rhythmic sentences. Repetition and gentle rhyme are welcome. Concrete nouns, sounds and colours. No peril beyond mild surprise.",
    wordsPerPage: [8, 30],
  },
  "early-reader": {
    id: "early-reader",
    label: "Early Reader",
    ages: "5–7",
    writingGuidance:
      "Simple sentences with sight words, a clear problem and resolution, light humour, one or two new vocabulary words per spread.",
    wordsPerPage: [25, 70],
  },
  "middle-grade": {
    id: "middle-grade",
    label: "Middle Grade",
    ages: "8–12",
    writingGuidance:
      "Richer prose and dialogue, emotional stakes, a satisfying arc with a turn in the middle. Still age-appropriate and hopeful.",
    wordsPerPage: [60, 140],
  },
};

export const AGE_GROUP_LIST = Object.values(AGE_GROUPS);

export const PAGE_COUNT = { min: 4, max: 20, default: 10 } as const;
