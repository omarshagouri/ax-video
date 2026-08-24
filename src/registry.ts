import React from "react";
import { z } from "zod";
import { makeHtmlCard, schemaFromSlots } from "./HtmlCard";
import { allCards } from "./cards/generated/allCards";

// Native, hand-ported cards (type-safe, the "target" form).
import { VCSF004, VCSF004Schema } from "./cards/VC-SF-004";
import { VCSF003, VCSF003Schema } from "./cards/VC-SF-003";
import { VCSF002, VCSF002Schema } from "./cards/VC-SF-002";
import { VCSF011, VCSF011Schema } from "./cards/VC-SF-011";

export type CardEntry = {
  component: React.FC<any>;
  schema: z.ZodTypeAny;
  native?: boolean;
};

// The 4 native ports take priority; everything else renders via HtmlCard
// (original css/body/seek, verbatim). All 29 cards are available on day one.
const native: Record<string, CardEntry> = {
  "VC-SF-004": { component: VCSF004, schema: VCSF004Schema, native: true },
  "VC-SF-003": { component: VCSF003, schema: VCSF003Schema, native: true },
  "VC-SF-002": { component: VCSF002, schema: VCSF002Schema, native: true },
  "VC-SF-011": { component: VCSF011, schema: VCSF011Schema, native: true },
};

export const registry: Record<string, CardEntry> = { ...native };
for (const id of Object.keys(allCards)) {
  if (registry[id]) continue; // native wins
  const data = allCards[id];
  registry[id] = {
    component: makeHtmlCard(data),
    schema: schemaFromSlots(data.slots),
  };
}

/** Validate a whole manifest's props against the registry (call in the builder/CI). */
export function validateTimeline(
  timeline: { component: string; props: unknown; beat: number }[]
): string[] {
  const errors: string[] = [];
  for (const item of timeline) {
    const entry = registry[item.component];
    if (!entry) {
      errors.push(`beat ${item.beat}: unknown card "${item.component}"`);
      continue;
    }
    const r = entry.schema.safeParse(item.props);
    if (!r.success) {
      errors.push(
        `beat ${item.beat} (${item.component}): ${r.error.issues
          .map((i) => i.message)
          .join(", ")}`
      );
    }
  }
  return errors;
}

/** Handy for tooling / the new Agent 6: list of every renderable card id. */
export const availableCards = () => Object.keys(registry).sort();
