import type { StoryConfig } from "@/types/book";
import type { StoryPlan } from "@/lib/llm/schemas";
import { hashString, mulberry32 } from "./random";

/**
 * Offline Story Director used in Demo mode. Produces a structurally valid,
 * premise-flavoured plan so the full UI flow can be tested without API calls.
 */
const CAST = [
  {
    id: "juniper",
    name: "Juniper",
    role: "protagonist",
    species: "young red fox kit",
    ageDescriptor: "child, about six in fox years",
    proportions: "small and round, oversized head, big pointed ears, short legs, fluffy white-tipped tail",
    skinOrFur: "rust-orange fur with a cream muzzle and chest",
    hair: "a cowlick tuft of darker orange fur between the ears",
    eyes: "large round amber eyes",
    outfit: "mustard-yellow raincoat with three red toggle buttons, green wellington boots",
    accessories: ["small brass compass on a cord"],
    distinguishingFeatures: ["a single white sock on the left front paw"],
    colorPalette: ["rust orange", "cream", "mustard yellow", "forest green", "red"],
    personality: "curious, brave, a little impatient",
    consistencyTokens:
      "Juniper, small young red fox kit, rust-orange fur, cream muzzle, big amber eyes, mustard-yellow raincoat with red toggle buttons, green wellington boots, brass compass on a cord, white left sock",
  },
  {
    id: "bramble",
    name: "Bramble",
    role: "best friend",
    species: "elderly hedgehog",
    ageDescriptor: "grandfatherly",
    proportions: "short and pear-shaped, tiny legs, round belly",
    skinOrFur: "soft beige face, brown-and-cream spines",
    hair: "bushy white eyebrows",
    eyes: "small black twinkling eyes behind round spectacles",
    outfit: "knitted teal scarf, plum waistcoat",
    accessories: ["round wire spectacles", "walking stick made of a twig"],
    distinguishingFeatures: ["one bent spine on top like a feather"],
    colorPalette: ["beige", "brown", "teal", "plum"],
    personality: "patient, wise, gently funny",
    consistencyTokens:
      "Bramble, old pear-shaped hedgehog, brown-and-cream spines, bushy white eyebrows, round wire spectacles, teal knitted scarf, plum waistcoat, twig walking stick",
  },
];

const BEATS = [
  (p: string, a: string) => `${a} woke to find the morning full of possibility. Today felt different, because ${p}.`,
  (_p: string, a: string, b: string) => `${a} hurried to tell ${b}, who peered over a pair of round spectacles and smiled.`,
  (_p: string, a: string) => `They packed a satchel with berries, string and a lantern, just in case. ${a} checked the compass twice.`,
  (_p: string, a: string) => `The path wound through tall grass that whispered as they passed. ${a} led the way, tail high.`,
  (_p: string, _a: string, b: string) => `At the old stone bridge, ${b} stopped to listen. "Do you hear that?" he asked.`,
  (_p: string, a: string) => `A tiny voice was calling for help from beneath the bridge. ${a}'s ears perked straight up.`,
  (_p: string, a: string) => `Down by the water, ${a} found a lost little duckling shivering among the reeds.`,
  (_p: string, a: string, b: string) => `"We'll help you find your way home," said ${a}, and ${b} nodded firmly.`,
  (_p: string, a: string) => `The sky darkened and the wind tugged at ${a}'s raincoat. The lantern flickered bravely.`,
  (_p: string, _a: string, b: string) => `${b} remembered an old song about the river, and hummed it to keep everyone calm.`,
  (_p: string, a: string) => `${a} spotted a glow far ahead: fireflies dancing above the mill pond.`,
  (_p: string, a: string) => `They crossed stepping stones one by one. ${a} held the duckling's wing the whole way.`,
  () => `At the mill pond, a worried mother duck paddled in circles, searching and calling.`,
  () => `The reunion was a flurry of feathers, quacks and happy splashes.`,
  (_p: string, a: string, b: string) => `The mother duck thanked ${a} and ${b} with a basket of warm seed cakes.`,
  (_p: string, a: string) => `On the walk home, ${a} noticed how the stars seemed to wink just for them.`,
  (_p: string, _a: string, b: string) => `${b} said that the bravest adventures are the ones where you help someone else.`,
  (_p: string, a: string) => `Back home, ${a} hung the raincoat on its hook and sighed a happy sigh.`,
  (_p: string, a: string) => `Snuggled in bed, ${a} held the compass and wondered where it would point tomorrow.`,
  (_p: string, a: string) => `And outside, the whole sleepy world agreed: it had been a very good day. Goodnight, ${a}.`,
];

const SHOTS = [
  "wide establishing shot",
  "medium two-shot",
  "low-angle hero shot",
  "over-the-shoulder shot",
  "close-up on faces",
  "high-angle wide shot",
  "tracking side view",
];

export function mockStoryPlan(config: StoryConfig): StoryPlan {
  const rand = mulberry32(hashString(config.premise));
  const premise = config.premise.trim().replace(/[.!?]+$/, "") || "something magical was about to happen";
  const lowerPremise = premise.charAt(0).toLowerCase() + premise.slice(1);
  const [a, b] = CAST;

  const n = config.pageCount;
  // Spread the 20 beats evenly across the requested page count, always keeping first & last.
  const beatIdx = Array.from({ length: n }, (_, i) => Math.round((i * (BEATS.length - 1)) / Math.max(1, n - 1)));

  return {
    title: `Juniper and the ${["Lantern", "Compass", "Moonlit", "Whispering"][Math.floor(rand() * 4)]} Adventure`,
    logline: `A curious fox kit and her hedgehog friend set out when ${lowerPremise}, and learn that helping others is the greatest adventure.`,
    characterBible: {
      characters: CAST,
      worldNotes:
        "A gentle countryside of rolling meadows, a winding river, an old stone bridge, a reed-fringed mill pond and a cosy burrow home with a round green door. Late-spring palette, golden mornings and blue-violet dusk.",
      turnaroundPrompt:
        "character reference turnaround sheet of Juniper the young red fox kit and Bramble the elderly hedgehog standing side by side, each shown in front view, three-quarter view, side view and back view, neutral expression, relaxed pose, full body, plain light background, all costume details clearly visible",
    },
    pages: beatIdx.map((bi, i) => ({
      pageNumber: i + 1,
      storyText: BEATS[bi](lowerPremise, a.name, b.name),
      sceneCompositionPrompt: `Scene ${i + 1}: ${BEATS[bi](lowerPremise, a.name, b.name).replace(/"/g, "")} Countryside setting from the world notes, expressive poses, readable silhouettes.`,
      charactersPresent: bi === 13 ? [] : bi % 3 === 0 ? [a.id] : [a.id, b.id],
      shotType: SHOTS[i % SHOTS.length],
      mood: i < n / 3 ? "bright, hopeful morning light" : i < (2 * n) / 3 ? "adventurous, dusky blue light" : "warm, glowing, cosy",
    })),
  };
}
