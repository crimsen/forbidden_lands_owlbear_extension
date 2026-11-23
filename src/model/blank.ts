import type {
  ArmorItem,
  ArmorPart,
  GearItem,
  GearWeight,
  Weapon
} from "@/model/types";

/** Gewichtsklassen für die Dialoge (feste Aufzählung, keine Regel). */
export const WEIGHTS: GearWeight[] = [
  "Normal",
  "Leicht",
  "Schwer",
  "Winzig",
  "–"
];

export const blankWeapon = (): Weapon => ({
  name: "Neue Waffe",
  grip: "1H",
  bonus: "–",
  damage: 1,
  range: "Arm",
  properties: "",
  weight: "Normal",
  price: null,
  notes: ""
});

export const blankArmor = (part: ArmorPart): ArmorItem => ({
  name: part === "Schild" ? "Neues Schild" : "Neue Rüstung",
  part,
  rating: 1,
  weight: "Normal",
  properties: "",
  price: null,
  notes: ""
});

export const blankItem = (): GearItem => ({
  name: "Neuer Gegenstand",
  weight: "Normal",
  quantity: 1,
  price: "",
  description: ""
});
