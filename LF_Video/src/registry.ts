import React from "react";
import { z } from "zod";
import { makeHtmlCard, schemaFromSlots } from "./HtmlCard";
import { allCards } from "./cards/generated/allCards";
import { animationRegistry } from "../shared_system/registry";
import { nativeClips } from "./clips";

export type CardEntry = {
  component: React.FC<any>;
  schema: z.ZodTypeAny;
  background?: string;
  backgroundDim?: number;
  authoredEndFrame?: number;
};

/** Permanently removed AX card; never advertise or render, even from stale generated data. */
export const bannedVisualIds = new Set(["VC-LF-016"]);

export const registry: Record<string, CardEntry> = { ...animationRegistry, ...nativeClips };
for (const id of Object.keys(allCards)) {
  if (bannedVisualIds.has(id)) continue;
  const data = allCards[id];
  registry[id] = {
    component: makeHtmlCard(data),
    schema: schemaFromSlots(data.slots),
  };
}

export function validateTimeline(
  timeline: { component: string; props: unknown; beat: number }[]
): string[] {
  const errors: string[] = [];
  for (const item of timeline) {
    if (bannedVisualIds.has(item.component)) {
      errors.push(`beat ${item.beat}: retired AX visual "${item.component}" is permanently prohibited`);
      continue;
    }
    // VV-LF-005+ are real Drive MP4s resolved by server/buildChapter.
    // Their visual IDs are catalog references, not React components in the
    // built-in registry (which only contains VV-LF-001..004 native previews).
    // Validate the resolved media source instead of requiring a fake component.
    if ((item as { track?: string }).track === "clip") {
      const clip = item as { component: string; src?: string; beat: number };
      if (!/^VV-LF-\d{3,}$/i.test(clip.component)) {
        errors.push(`beat ${clip.beat}: invalid footage ID "${clip.component}"`);
      } else if (!clip.src || !/^https?:\/\//i.test(clip.src)) {
        errors.push(`beat ${clip.beat}: Drive footage "${clip.component}" has no resolved MP4 source`);
      }
      continue;
    }
    const entry = registry[item.component];
    if (!entry) {
      errors.push(`beat ${item.beat}: unknown visual "${item.component}"`);
      continue;
    }
    const r = entry.schema.safeParse(item.props);
    if (!r.success) {
      errors.push(
        `beat ${item.beat} (${item.component}): ${r.error.issues.map((i) => i.message).join(", ")}`
      );
    }
  }
  return errors;
}

export const availableCards = () => Object.keys(registry).filter((id) => id.startsWith("VC-LF-")).sort();
export const availableAnimations = () => Object.keys(registry).filter((id) => /^VA-LF-\d{3}$/.test(id)).sort();
export const availableVisuals = () => Object.keys(registry).sort();
