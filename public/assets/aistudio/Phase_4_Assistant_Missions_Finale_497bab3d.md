# SOLAR ODYSSEY — PHASE 4 OF 4: Virtual Assistant, Missions & Final Objective

> **How to use this document:** This is the last of four build phases. Phase 1 (foundation, controls, bars, stats, status effects, energy, oxygen, suit), Phase 2 (inventory, resources, tools, upgrade tree, ship upgrades) and Phase 3 (planet map, travel, special scenarios, travel cinematic) are already built. Extend that code; do not rewrite it. Build ONLY what is described here.
>
> **Phase 4 delivers:** the virtual assistant, the mission system with rewards, the final objective at the Sun, and the last two cinematics. When done, run through the full game from the start menu to the final cinematic.
>
> **Hooks to connect with earlier phases:** the assistant explains the mechanics of Phases 1–3 and reacts when the player tries to open something locked; missions affect the water, oxygen, energy and storage systems (Phases 1–2) and apply the Sadness state when lost (Phase 1, 3.2); rewards give resources and player upgrades (Phase 2); the Sun scenario with gravitational pull and solar flares (Phase 3, 3.11) is extended here with the 50-panel objective.

---

## 2. VIRTUAL ASSISTANT

### 2.1 Behavior
- A friendly assistant that appears when the user unlocks mechanics and has questions. Gives short instructions and information it has at hand.
- A button in the top-right corner (below the map button) opens the assistant. The assistant appears in the top-left.
- Flow: the assistant asks "What do you want to know?" → after answering, asks "Do you need anything else?" → two buttons, **Yes** / **No**. Yes returns to the first question; No closes the assistant.
- The user can consult the assistant any time about mechanics they are unsure about.
- It explains with a dashboard that shows images as tutorials.
- If the user tries to access something locked, the assistant says in a funny way that it cannot be accessed yet because the requirements are not met.
- The assistant presents missions with a **worried** mood.

### 2.2 Topics it must explain (briefly)
Agriculture; the oxygen mechanic; the status effects; equipping/unequipping the suit and what happens; the tools; how to process gases; the energy mechanics; the upgrade tree; the inventory; how to collect minerals; how the ship works in the Jupiter events; the final objective at the Sun (building the Dyson sphere).

### 1.10 Animations (Phase 4 subset)
- **Virtual assistant:** worried, cheerful, curious.
- **Interface actions:** open/close the assistant.
- Confetti animation when a mission is completed.

---

## 3. BACKEND / GAME SYSTEMS

### 3.12 Missions (RPG) and Rewards
- Missions are random events presented by the assistant (worried mood). They are solved by approaching the failure and interacting with it.
  - **Oxygen production failure:** solved in the energy area.
  - **Energy failure (hardest):** solved in the energy area; solved once and never appears again.
  - **Water failure:** dehydration begins (−10% every 5 s); solved in the storage.
  - **Storage failure:** lose 3% of the total mineral amount; solved in the storage.
- **Rewards:** resources and player upgrades. Confetti animation on every completed mission; a special reward (such as different pets) for completing a hard mission.

### 3.13 Final Objective (Sun)
- Upon reaching the Sun, the objective is to place **50 panels**. The zone shows the Sun as an enormous sphere.
- Solar flares appear **1 every 4 seconds**. Hitting a flare, or getting too close to the Sun, means losing: the Mercury-to-Sun cinematic repeats and the panel progress resets.
- Placing all 50 panels without losing triggers the final cinematic (the Dyson sphere is completed).

---

## 4. CINEMATICS (HTML animations) — Phase 4 subset

Each cinematic plays full-screen over the game, adapts to phone, tablet and laptop, and returns control to the game when it ends. Replace each placeholder with the full code of the corresponding animation.

### 4.2 Mercury-to-Sun animation
- **Source:** https://onecompiler.com/html/459akkejp
- **Trigger:** plays when the user travels from Mercury to the Sun. It leads to the final phase, and it replays if the user loses at the Sun.

```html
<!-- PASTE THE FULL CODE OF ANIMATION 4.2 HERE -->
```

### 4.3 Final animation
- **Source:** https://onecompiler.com/html/459akw3qv
- **Trigger:** plays once the player completes the objective of placing the 50 panels for the Dyson sphere without losing. It is the ending of the game.

```html
<!-- PASTE THE FULL CODE OF ANIMATION 4.3 HERE -->
```

---

## Reminder of the technical requirements (apply to the whole game)
- The game must be public, delivered through a GitHub repository link.
- It must adapt to phone, tablet and laptop.
- The game must be interactive.
