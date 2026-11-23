/**
 * Lokale Spiegel-Typen der App-Datenmodelle. Die Extension enthält bewusst
 * keine Spielregeln — sie zeigt nur an und sendet Aktionen zurück.
 * shortcut: nur die genutzten Felder; bei App-Änderungen hier nachziehen.
 */

export interface Attribute {
  value: number;
  health: number;
}

export interface Appearance {
  face: string;
  body: string;
  clothing: string;
}

export interface Money {
  gold: number;
  silver: number;
  copper: number;
}

export interface SkillRow {
  name: string;
  attribute: string;
  value: number;
  draft: number;
}

export interface TalentRow {
  name: string;
  level: number;
  draft: number;
  hasTeacher: boolean;
}

export type GearWeight = "Normal" | "Leicht" | "Schwer" | "Winzig" | "–";

export interface Weapon {
  name: string;
  grip: string;
  bonus: string;
  damage: number;
  range: string;
  properties: string;
  weight: GearWeight;
  price: number | null;
  notes: string;
}

export type ArmorPart = "Kopf" | "Körper" | "Schild";

export interface ArmorItem {
  name: string;
  part: ArmorPart;
  rating: number;
  weight: GearWeight;
  properties: string;
  price: number | null;
  notes: string;
}

export interface GearItem {
  name: string;
  weight: GearWeight;
  quantity: number;
  price: string;
  description: string;
}

export type ResourceDie = "W6" | "W8" | "W10" | "W12";

export interface Consumable {
  name: string;
  die: ResourceDie | null;
}

export interface GearEntry<T> {
  id: string;
  equipped: boolean;
  data: T;
}

export interface GearSet {
  weapons: GearEntry<Weapon>[];
  armor: GearEntry<ArmorItem>[];
  consumables: GearEntry<Consumable>[];
  items: GearEntry<GearItem>[];
}

export interface MountState {
  id: string;
  name: string;
  animalName: string;
  strength: Attribute;
  agility: Attribute;
  movement: number;
  skills: string;
  attack: string;
  damage: string;
  dead: boolean;
  gear: GearSet;
}

export interface CharacterState {
  name: string;
  profession: string;
  kin: string;
  attributes: Record<string, Attribute>;
  appearance: Appearance;
  pride: string;
  darkSecret: string;
  skills: SkillRow[];
  xp: number;
  advancedMode: boolean;
  talents: TalentRow[];
  characterGear: GearSet;
  mounts: MountState[];
  willpower: number;
  reputation: number;
  spellbook: string[];
  notes: string;
  money: Money;
  criticalInjury: string;
  activeStates: string[];
  collapsedPanels: string[];
}

export interface TalentLevel {
  level: number;
  effect: string;
  artifact?: number;
}

export interface Talent {
  name: string;
  category: "kin" | "profession" | "general";
  requirement?: string;
  magical?: boolean;
  levels: TalentLevel[];
}

export interface Animal {
  name: string;
  rideable?: boolean;
  strength: number;
  agility: number;
  movement: number;
  skills: string;
  attack: string;
  damage: string;
}

export interface StateDefinition {
  id: string;
  name: string;
  icon: string;
  rule: string;
}

export interface Spell {
  name: string;
  discipline: string;
  rank: number;
  reach: string;
  duration: string;
  component: string;
  effect: string;
}

/** Stammdaten (Regelwerk) der App, wie über die Bridge empfangen. */
export interface Ruleset {
  seedVersion: number;
  attributes: string[];
  weapons: Weapon[];
  armor: ArmorItem[];
  items: GearItem[];
  consumables: string[];
  animals: Animal[];
  talents: Talent[];
  spells: Spell[];
  states: StateDefinition[];
  skills: { name: string; attribute: string }[];
  kinOptions: string[];
  professionOptions: string[];
}

export type RollGroup =
  | "attribute"
  | "skill"
  | "weapon"
  | "armor"
  | "consumable"
  | "event"
  | "free";

/** Ein Artefaktwürfel-Typ mit Anzahl im Wurf-Dialog. */
export interface ArtifactParam {
  sides: number;
  dice: number;
}

/** Parameter eines Wurfs; die Extension passt sie an und schickt sie zurück. */
export type RollParams =
  | {
      kind: "check";
      label: string;
      attribute: string;
      attributeDice: number;
      skill?: string;
      skillDice?: number;
      weapon?: string;
      weaponDice?: number;
      artifacts: ArtifactParam[];
      /** Freier Wurf: alle Zähler frei, beliebig oft würfelbar. */
      free?: boolean;
    }
  | { kind: "armor"; armorIds: string[]; damage?: number }
  | { kind: "consumable"; refId: string }
  | { kind: "event" };

export interface RollButton {
  id: string;
  group: RollGroup;
  label: string;
  notation: string;
  params: RollParams;
}

/** Eine Würfelgruppe, wie die App sie auswertet. */
export interface CheckGroup {
  description: string;
  dice: number[];
  successes: number;
  artifact: boolean;
}

/** Auswertung einer Probe (von der App). */
export interface CheckEvaluation {
  kind: "check";
  label: string;
  successes: number;
  failures: number;
  /** Bereits angerechnete 1en aus einem früheren Strapazieren. */
  appliedFailures: number;
  groups: CheckGroup[];
  canPush: boolean;
  pushLabel: string;
  pushCount: number;
}

/** Eine Abnutzungszeile des Rüstungswurfs. */
export interface DegradationRow {
  id: string;
  name: string;
  value: number;
  max: number;
}

export interface ArmorEvaluation {
  kind: "armor";
  label: string;
  absorbed: number;
  damage: number;
  degradation: DegradationRow[];
  destroyed: string[];
}

export interface ConsumableEvaluation {
  kind: "consumable";
  refId: string;
  dieBefore: ResourceDie | null;
  dieAfter: ResourceDie | null;
  value: number;
}

export interface EventEvaluation {
  kind: "event";
  label: string;
  value: number;
}

export type RollEvaluation =
  | CheckEvaluation
  | ArmorEvaluation
  | ConsumableEvaluation
  | EventEvaluation;

export interface CharacterView {
  state: CharacterState;
  derived: {
    capacity: number;
    currentLoad: number;
    remainingLoad: number;
    magicRanks: Record<string, number>;
    kinTalent: string | null;
    castableSpells: Spell[];
    spellDisciplines: string[];
    learnableTalents: string[];
    /** Waffen des Charakters für die Waffenauswahl im Wurf-Dialog. */
    weaponOptions: { id: string; name: string; label: string; dice: number }[];
    /** Talente des Charakters, die Artefaktwürfel gewähren. */
    talentOptions: { name: string; label: string; die: number }[];
  };
  rolls: RollButton[];
}
