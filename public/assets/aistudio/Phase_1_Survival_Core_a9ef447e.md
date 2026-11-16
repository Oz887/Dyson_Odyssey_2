# SOLAR ODYSSEY — PHASE 1 OF 4: Foundation & Survival Core

> **How to use this document:** This is the first of four build phases. Build ONLY what is described here. Later phases (resources and tools, space travel and map, virtual assistant, missions and final objective) will be provided in separate documents. Keep the code modular so later phases can be plugged in without rewriting this one.
>
> **Phase 1 delivers:** the project base, the start menu, device controls, the option-screen framework, the status bars, and the full survival logic (stats, status effects, energy, oxygen and suit).
>
> **Not in this phase:** planet map and travel, inventory contents, tools and upgrades, minerals, gases, fuel, consumables, agriculture, missions, virtual assistant, and cinematics. Where a rule below mentions one of these, create the variable or hook it needs and leave the full behavior for its phase.

---

## 0. Project Goal

Build **"Solar Odyssey"**, an interactive educational web game for kids about surviving beyond Earth. It is for anyone who loves game design, systems thinking, or simply wants to build something children can play that makes them smarter about space. The game should empower the next generation of explorers by teaching what it really takes to live beyond Earth, balancing fun with the truth of space science.

The mechanics exist to teach and entertain, showing the real logic of how NASA keeps people alive outside Earth. Every decision must have positive and negative consequences.

### Technical requirements
- The game must be public, delivered through a GitHub repository link.
- It must adapt to phone, tablet and laptop.
- The game must be interactive.

---

## 1. FRONTEND

### 1.1 Start Menu
- Image on the middle-right of the screen.
- Top-left: the title "Solar Odyssey".
- Below the title: a **Play** button and a **Saved Games** button (Saved Games resumes where the player left off).

### 1.2 Controls

| Device | Player movement | Ship movement (special scenarios) |
|---|---|---|
| Phone | Direction pad (up, down, left, right) in the bottom-left corner | Ship heads toward where the user presses |
| Tablet | Direction pad in the bottom-left corner | Ship heads toward where the user presses |
| Laptop | Keyboard arrow keys | Ship heads toward the cursor |

(Ship movement is used in the special scenarios of Phase 3; in this phase implement the player movement and leave the ship input ready.)

### 1.3 Option Selection Screens
Start menu, planet map, inventory, upgrade tree, sleep, tool upgrade menu (where tools are upgraded), storage (holds minerals, fuel and consumables).
- Option buttons must be colorful.

(In this phase build the screen framework, the start menu and the sleep screen; the remaining screens are filled in by later phases.)

### 1.4 Bars
| Bar | Behavior |
|---|---|
| Temperature | Depends on the planet |
| Hunger | Drops 1% every 4 seconds; recovers by eating |
| Hydration | Drops 1% every 2 seconds; recovers by drinking |
| Health | Stable until a status effect alters it |
| Fatigue | Decreases when running or mining for a long time; recharges quickly |

### 1.10 Animations (Phase 1 subset)
- **Character:** movement, standing, fatigue, illness, freezing, burn, training, consumption, hydration, interaction, attack.
- **Interface actions:** selecting options, open/close menus; sleep/wake up; pressing buttons; enter/exit the ship.

---

## 3. BACKEND / GAME SYSTEMS

### 3.1 Statistics
| Stat | Rules |
|---|---|
| Water | Sustains the Motivation state. Without hydration, the user becomes Dehydrated and loses health |
| Energy | Maintains oxygen (without energy the ship produces no oxygen), crops and lighting |
| Health | Depends on water, food and oxygen; if any is critical, health is lost |
| Fuel | Needed to travel; without fuel the tools cannot be used |
| Food | Needed to maintain health; recharged by consuming meats and vegetation |
| Oxygen | Fundamental for health; without it health is lost very quickly. Recharged by entering the ship or the player's space base on a planet |
| Temperature | Prevents Burn and Freezing; sustained by ship energy |
| Drop | Amount of minerals or gases collected from a mineral vein or the environment |
| Gravitational pull | A tug effect pulling the ship (user) toward the planet/star. Used in specified zones |
| Space objects | Threats to the ship. Used in special events and specified zones |
| Solar flares | Wave-shaped threats; activate when the user reaches the Sun |

### 3.2 Status Effects
| State | Trigger | Effect |
|---|---|---|
| Pressure | In space without a helmet | Dizziness cinematic is added |
| Illness | Consuming contaminated water/vegetables/meat | Weakness state and health loss |
| Freezing | Temperature below −150°C | Movement −40%; slow health loss |
| Burn | Temperature above 95°C | Fast health loss |
| Motivation | Training while not hungry or dehydrated | Water and hunger drop more slowly |
| Sadness | Losing a mission | Moves slower |
| Dehydrated | Water bar below 20% | Health loss |
| Hungry | Hunger bar below 20% | Health loss |
| Weakness | — | Loses water and hunger |

### 3.3 Energy
- Obtained passively, depending on the planet's solar exposure.
- **Low-energy planet:** energy is drained by ship oxygen and agriculture. **Moderate:** not drained by ship oxygen. **High:** not drained by agriculture or ship oxygen.
- Passive drain: agriculture −2% every 4 seconds; ship oxygen −1% every 5 seconds. Building fuel consumes 10% directly.
- At **20%**: warn the player to suspend agriculture.
- At **0%**: the ship stops providing oxygen and an alarm tells the user to put on the suit. After a 30-second pause, energy recharges passively: low 2% / 5 s, moderate 4% / 5 s, high 10% / 5 s.

(The planet's energy level is a variable; until Phase 3 exists, use a test value, e.g. the Earth/Moon "moderate" level. Agriculture and fuel building arrive in Phase 2; expose the hooks for their drain.)

### 3.4 Oxygen
- Inside the ship the user loses no oxygen (ship oxygen depends on energy).
- Without the suit equipped (e.g., ship at 0% energy): −10% every 5 seconds.
- With the suit equipped: passive loss, base **10% every 10 seconds**.
- Reductions: completing the oxygen section of the upgrade tree lowers the loss to 5% every 10 seconds. Oxygen tank tool levels: Basic −1%, Updated −2%, Advanced −3%, Industrial −4%.
- Hard floor: the passive loss can never go below **1% every 10 seconds**.

(The upgrade tree and the oxygen tanks arrive in Phase 2; in this phase build the oxygen loss calculation with those reductions as configurable values, defaulting to zero.)

### 3.5 Suit
- Can be equipped/unequipped from the tools area.
- Without the suit the user withstands only **−10°C to 50°C**. Beyond that range, health drops 10% every 5 seconds.

(The tools area is built in Phase 2; in this phase provide a temporary equip/unequip control so the suit logic can be tested.)

---

## OPEN QUESTION relevant to this phase
- **Oxygen tank bonus:** are the −1% to −4% values per tier replaced by the highest equipped tier, or cumulative? (Tree −5% plus tank −4% gives exactly the 1% floor if not cumulative.) Until answered, implement it as NOT cumulative and keep it easy to change.
