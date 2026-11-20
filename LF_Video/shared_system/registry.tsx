import React from "react";
import { z } from "zod";

/** One file = one animation. Adding VA_LF_021.tsx needs no registry edits. */
export type AnimEntry = {
  component: React.FC<any>;
  schema: z.ZodTypeAny;
  description: string;
  slots: string[];
  defaultDurationSec: number;
  background?: string;
  backgroundDim?: number;
  authoredEndFrame?: number;
};

type AnimationModule = {
  animation: AnimEntry & { id: string };
};

// Webpack builds an index from the filenames rather than maintaining imports by hand.
// The declaration describes webpack's require.context API to TypeScript.
declare const require: {
  context: (directory: string, recursive: boolean, expression: RegExp) => {
    keys(): string[];
    (name: string): AnimationModule;
  };
};

const modules = require.context("../Animations", false, /^\.\/VA_LF_\d{3}\.tsx$/);
export const animationRegistry: Record<string, AnimEntry> = {};

for (const file of modules.keys().sort()) {
  const expectedId = file.slice(2, -4);
  const entry = modules(file).animation;
  if (!entry || entry.id !== expectedId) {
    throw new Error(`${file} must export animation.id = ${expectedId}`);
  }
  if (!entry.component || !entry.schema || entry.defaultDurationSec <= 0) {
    throw new Error(`${file} has an incomplete animation configuration`);
  }
  animationRegistry[entry.id] = entry;
  // Existing Google Sheets/Make visual plans use these IDs. Accept them until migrated.
  animationRegistry[entry.id.replace(/^VA_LF_/, "VA-LF-")] = entry;
}

// Show canonical names to editors while retaining legacy input compatibility.
export const availableAnimations = () =>
  Object.keys(animationRegistry).filter((id) => /^VA-LF-\d{3}$/.test(id)).sort();
