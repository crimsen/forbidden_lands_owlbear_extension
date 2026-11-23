import type { RollButton } from "@/model/types";

/** Ein Artefaktwürfel-Typ mit Anzahl. */
export interface RollArtifactParam {
  sides: number;
  dice: number;
}

export interface RollDice {
  attributeDice: number;
  attribute?: string | undefined;
  skillDice?: number | undefined;
  skill?: string | undefined;
  weaponDice?: number | undefined;
  weapon?: string | undefined;
  artifacts?: RollArtifactParam[] | undefined;
}

const group = (dice: number, marker: string, name: string, sides = 6) =>
  `${dice}d${sides}{${marker}}#${name}`;

/**
 * Dice+-Notation wie in der App. Die Extension baut sie nur lokal, wenn die App
 * nicht verfügbar ist (sonst baut die App die Notation und wertet aus).
 */
export const rollNotation = (roll: RollDice): string => {
  const parts: string[] = [];

  if (roll.attributeDice > 0)
    parts.push(group(roll.attributeDice, "A", roll.attribute || "Attribut"));
  if (roll.skill && (roll.skillDice ?? 0) > 0)
    parts.push(group(roll.skillDice ?? 0, "F", roll.skill));
  if ((roll.weaponDice ?? 0) > 0)
    parts.push(group(roll.weaponDice ?? 0, "W", roll.weapon ?? "Waffe"));

  for (const artifact of [...(roll.artifacts ?? [])].sort(
    (a, b) => a.sides - b.sides
  )) {
    if (artifact.dice <= 0) continue;
    const name = `W${artifact.sides}`;
    parts.push(group(artifact.dice, name, `Artefakt ${name}`, artifact.sides));
  }

  return parts.join(" + ");
};

/** Ereigniswurf (T66) — feste Notation. */
export const EVENT_ROLL = {
  notation: "T66 #Ereigniswurf",
  label: "Ereigniswurf"
};

/** Fester Button für den freien Wurf (auch ohne App verfügbar). */
export const FREE_ROLL: RollButton = {
  id: "free",
  group: "free",
  label: "Freier Wurf",
  notation: "",
  params: {
    kind: "check",
    free: true,
    label: "",
    attribute: "",
    attributeDice: 0,
    skillDice: 0,
    weaponDice: 0,
    artifacts: []
  }
};

/** Fester Button für den Ereigniswurf (auch ohne App verfügbar). */
export const EVENT_ROLL_BUTTON: RollButton = {
  id: "event",
  group: "event",
  label: EVENT_ROLL.label,
  notation: EVENT_ROLL.notation,
  params: { kind: "event" }
};
