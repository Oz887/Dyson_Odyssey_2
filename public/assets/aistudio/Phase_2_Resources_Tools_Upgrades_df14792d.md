# SOLAR ODYSSEY — PHASE 2 OF 4: Resources, Tools & Upgrades

> **How to use this document:** This is the second of four build phases. Phase 1 (foundation, start menu, controls, bars, stats, status effects, energy, oxygen and suit) is already built. Extend that code; do not rewrite it. Build ONLY what is described here.
>
> **Phase 2 delivers:** the inventory, minerals, gases and fuel, consumables, agriculture, the tools system, the upgrade tree and the ship upgrades.
>
> **Not in this phase:** planet map and travel, special scenarios, virtual assistant, missions and the final objective. Where a rule mentions planets, use test values until Phase 3.
>
> **Hooks to connect with Phase 1:** agriculture drains energy (3.3); building fuel consumes 10% energy (3.3); oxygen tanks and the oxygen section of the upgrade tree reduce passive oxygen loss (3.4); the suit is equipped/unequipped from the tools area (3.5); eating and drinking recover the hunger and hydration bars (1.4).

---

## 1. FRONTEND

### 1.7 Ship Upgrades (create a cinematic for each upgrade)
- **Basic (Earth):** Control room, Storage, Bedroom, Food area, Energy area, Tools room.
- **Improved (Moon):** Garden, Infirmary.
- **Advanced (Asteroid Belt):** Gym, Energy area (power upgrade), Defense upgrades.
- **Elite (Uranus):** Advanced AI, Recycling system, Laboratory, Temperature regulator.
- **Legendary (Mercury):** Improved shield, Quantum technology, Electromagnetic fields.

(Build the upgrade structure and unlock conditions by ship level; the planets that unlock each level are connected in Phase 3.)

### 1.8 Upgrade Tree
Progressive upgrades for: mineral collection, oxygen capacity, energy capacity and efficiency, water capacity and efficiency, food improvement and efficiency.

### 1.9 Inventory
- Lets the user consume food and water directly.
- Stores a maximum of **5 of each mineral**.
- Cannot store gases; the user must use the gas storage tool.
- Columns: **[Minerals, Fuel, Food, Water]**
  - Minerals: Iron, Titanium, Ilmenite, Silicon, Nickel, Platinum, Carbon
  - Fuel: Hydrogen + Oxygen, Helium-3
  - Food: Sealed-bag meats (Chicken, Beef fajitas, Chili con carne, Turkey, Tuna) and Dehydrated meats (chicken bouillon cubes, soups)

### 1.10 Animations (Phase 2 subset)
- **Interface actions:** open/close inventories, upgrade tree, storage, tools menu.
- **Collection:** minerals, crops.
- **Crop growth:** premature, semi-developed, ready to harvest.
- Show the matching animation for each tool, and create a cinematic for each tool and ship upgrade.

---

## 3. BACKEND / GAME SYSTEMS

### 3.6 Minerals
| Mineral | Rarity |
|---|---|
| Iron | Very common |
| Titanium | Common |
| Ilmenite | Common in certain regions |
| Silicon | Very common |
| Nickel | Uncommon |
| Platinum | Rare |
| Carbon | Depends on the planet |

Collected minerals regenerate after **10 seconds**.

### 3.7 Gases and Fuel
- **Gases** are obtained from the environment or from minerals. Oxygen: from treating ilmenite in the energy area, or from the atmosphere of a planet with oxygen (common). Hydrogen: from the atmosphere of a planet with hydrogen (common).
- **Fuel** is obtained by fusing gases or in specific zones, and is created in the fuel zone inside the ship.
  - **Hydrogen + Oxygen:** fusing both gases; costs some energy.
  - **Helium-3:** collected naturally on the Moon; can be stored but not used until later in the game (see Open Questions).

### 3.8 Eating and Consumables
- Eating consumes the chosen consumable only, reducing its count by 1. Consumables must offer the option to be consumed.
- **Meats** (starting quantity 44 each): Chicken, Beef fajitas, Chili con carne, Turkey, Tuna (sealed bags); chicken bouillon cubes, soups (dehydrated).
- **Vegetation** (starting quantity 0, increased through agriculture): Tomato, Lettuce, Cucumber, Radish, Spinach, Leafy greens, Cabbage, Arugula, Beet, Basil, Parsley, Chives.

### 3.9 Agriculture
- Can be switched on or off. It drains energy passively; when off, it drains nothing, crops do not grow and growth stays paused.
- Each crop takes **2 minutes** to develop. When fully grown, the user can interact to harvest, and the counter of that crop increases by +1.

### 3.10 Tools
- **Four equipable types, one of each:** Drill, Mineral Storage, Fuel Collector, Fuel Storage. The player chooses which tool to use.
- **Levels:** Basic → Updated → Advanced → Industrialized. A higher level cannot be used until every previous level is unlocked. Each level needs more minerals and is more efficient; capacity increases with level.
- Drills only interact with minerals; fuel/gas collectors only with gases. Mineral storage deposits minerals; gas storage deposits collected gases. Show the matching animation for each tool. Create a cinematic for each upgrade.
- **Oxygen tanks** are upgraded in the same menu (same four levels) and reduce passive oxygen loss.
- **Upgrade materials (same list for every level, quantity grows):**
  - Drill: Iron, Titanium, Silicon, Nickel
  - Mineral storage: Iron, Titanium, Carbon
  - Oxygen tanks: Titanium, Nickel, Carbon, Silicon, Iron
  - Fuel collector: Iron, Nickel, Silicon, Platinum
  - Fuel storage: Iron, Titanium, Carbon, Nickel

---

## OPEN QUESTIONS relevant to this phase
1. **Helium-3:** one note says it cannot be used until Neptune; another says it is used at Mercury with the last upgrade. Which is correct? Until answered, store it but block its use, and keep the unlock point configurable.
2. **Oxygen tanks** appear in the tool upgrade list but are not one of the four equipable tool types; treat them as a passive upgrade.
3. **Oxygen tank bonus:** are the −1% to −4% values per tier replaced by the highest equipped tier, or cumulative? Implement as NOT cumulative and keep it easy to change.
