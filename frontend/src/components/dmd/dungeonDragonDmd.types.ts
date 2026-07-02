import type { DmdViewModel } from "@/lib/dmd-messages";

export type RenderMetrics = {
  cellHeight: number;
  cellWidth: number;
  radius: number;
};

export type DiodeTone = "dim" | "amber" | "bright" | "danger" | "stone";

export type ClassIcon = NonNullable<DmdViewModel["activeClass"]>;

export type DmdIconPatterns = Partial<Record<ClassIcon, readonly string[]>>;

export type DmdSpriteFrames = readonly (readonly string[])[];

export type LiveBackgroundEffectResources = {
  mineFrames: DmdSpriteFrames;
  rubyFrames: DmdSpriteFrames;
};
