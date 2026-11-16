# SOLAR ODYSSEY — PHASE 3 OF 4: Planet Map, Travel & Special Scenarios

> **How to use this document:** This is the third of four build phases. Phase 1 (foundation, controls, bars, stats, status effects, energy, oxygen, suit) and Phase 2 (inventory, minerals, gases and fuel, consumables, agriculture, tools, upgrade tree, ship upgrades) are already built. Extend that code; do not rewrite it. Build ONLY what is described here.
>
> **Phase 3 delivers:** the planet map, the route and distances, the conditions of every planet, travel with the travel cinematic, and the special ship scenarios at Jupiter, Saturn and the Sun (gravitational pull, space objects, ship controls).
>
> **Not in this phase:** the virtual assistant, missions and rewards, and the final objective (placing the 50 panels). At the Sun, only activate the scenario (gravitational pull and solar flares); the objective and its win/lose rules arrive in Phase 4.
>
> **Hooks to connect with earlier phases:** the planet's solar energy level feeds the energy rules (Phase 1, 3.3); each planet's temperature feeds Burn/Freezing (Phase 1, 3.2); fuel quantity (Phase 2) decides whether a trip is possible; reaching Moon, Asteroid Belt, Uranus and Mercury unlocks the ship upgrade levels (Phase 2, 1.7).

---

## 1. FRONTEND

### 1.2 Ship Controls (special scenarios)

| Device | Ship movement |
|---|---|
| Phone | Ship heads toward where the user presses |
| Tablet | Ship heads toward where the user presses |
| Laptop | Ship heads toward the cursor |

### 1.5 Planet Map
- Located in the ship's control area; opens when the user clicks the control post inside the ship.
- Shows all planets and the route the ship takes between them. All planets and routes are interactive.
- Clicking a planet shows its brief description. Clicking a planet (when travel conditions are met) starts the trip.
- The map shows the distance between consecutive planets.
- A planet becomes available only when it is unlocked and the user has enough fuel for the trip. Locked planets stay dark.
- **There is no going back:** once a trip starts, the player cannot return to the previous planet.

**Route order:** Earth → Moon → Mars → Asteroid Belt → Jupiter → Saturn → Uranus → Neptune → Venus → Mercury → Sun.

**Planet descriptions (shown in the map):**
- **Earth:** A rocky planet with abundant liquid water. Atmosphere composed mainly of nitrogen and oxygen. Average distance from the Sun: 149.6 million km. Fact: The only known planet with confirmed life.
- **Moon:** Earth's natural satellite. Almost no atmosphere and heavily cratered surface. Average distance from Earth: 384,400 km. Fact: Its gravity is approximately 16.5% of Earth's gravity.
- **Mars:** A cold, rocky planet with a thin carbon dioxide atmosphere. Average distance from the Sun: 227.9 million km. Fact: Olympus Mons is the largest known volcano in the Solar System.
- **Asteroid Belt:** A region between Mars and Jupiter containing millions of rocky and metallic objects. Resources: iron, nickel, cobalt, silicates and potentially water-bearing minerals. Fact: Ceres is the largest object in the asteroid belt and is classified as a dwarf planet.
- **Jupiter:** The largest planet in the Solar System. A gas giant composed mainly of hydrogen and helium. Average distance from the Sun: 778.5 million km. Resources: hydrogen, helium and atmospheric compounds. Fact: Its Great Red Spot is an enormous long-lasting atmospheric storm.
- **Saturn:** A gas giant famous for its extensive ring system. Composed mainly of hydrogen and helium. Average distance from the Sun: 1.43 billion km. Resources: hydrogen, helium and atmospheric compounds. Fact: Its moon Titan has lakes and seas of liquid methane and ethane.
- **Uranus:** An ice giant with a blue-green appearance caused by atmospheric methane. Average distance from the Sun: 2.87 billion km. Fact: Its rotational axis is tilted approximately 98 degrees.
- **Neptune:** A distant ice giant with an extremely dynamic atmosphere. Average distance from the Sun: 4.50 billion km. Fact: It experiences some of the fastest winds measured on any planet.
- **Venus:** A rocky planet with an extremely dense carbon dioxide atmosphere. Average distance from the Sun: 108.2 million km. Fact: Its surface temperature is approximately 465°C, making it hotter than Mercury.
- **Mercury:** The smallest planet and the closest to the Sun. A rocky planet with almost no atmosphere. Average distance from the Sun: 57.9 million km. Fact: Despite being closest to the Sun, it is not the hottest planet.
- **Sun:** Composed primarily of hydrogen and helium. Surface temperature: approximately 5,500°C. Core temperature: approximately 15 million°C. Composition: approximately 73% hydrogen and 25% helium by mass, with small amounts of heavier elements. Potential resources: hydrogen, helium and solar energy. Fact: The Sun produces energy through nuclear fusion, converting hydrogen into helium. Special feature: Its enormous gravitational influence keeps the planets and other celestial bodies in orbit.

**Distances between consecutive stops** (mean distance between orbits, for the route map and the ship's odometer):
- Mercury ↔ Venus: 50,298,950 km (0.336 AU)
- Venus ↔ Earth: 41,390,023 km (0.277 AU)
- Earth ↔ Moon: 384,400 km (0.00257 AU)
- Earth ↔ Mars: 78,341,343 km (0.524 AU; up to 401 million km when on opposite sides of the Sun)
- Mars ↔ Asteroid Belt: 186,060,634 km (1.246 AU)
- Asteroid Belt ↔ Jupiter: 364,479,000 km (2.434 AU)
- Jupiter ↔ Saturn: 655,051,000 km (4.378 AU)
- Saturn ↔ Uranus: 1,437,442,000 km (9.619 AU)
- Uranus ↔ Neptune: 1,627,428,000 km (10.846 AU)

### 1.6 Planet Conditions

| Planet | Temperature | Solar energy received | Notes |
|---|---|---|---|
| Earth | — | — | The beginning |
| Moon | — | Moderate | Water collection, greenhouses, Helium-3 is obtained here |
| Mars | −65°C | Moderate | |
| Asteroid Belt | — | Moderate | Largest concentration of minerals |
| Jupiter | −110°C | Low | Cannot land (special scenario) |
| Saturn | −140°C | Low | Cannot land (special scenario) |
| Uranus | −195°C | Low | |
| Neptune | −200°C | Low | |
| Venus | 464°C at surface | High | |
| Mercury | Mean 167°C; 430°C by day, −180°C by night | High | |
| Sun | — | — | Gravity maneuvering complications, solar flares; the game is completed with the Dyson sphere |

---

## 3. BACKEND / GAME SYSTEMS

### 3.11 Special Scenarios
- **Jupiter and Saturn (cannot land):** a special ship scenario where the player dodges objects and escapes the planet's gravitational pull. Hitting an object causes damage; failing to escape the pull means the player loses.
- **Sun (cannot land):** gravitational pull and solar flares are activated.

### Related definitions (from Statistics, 3.1)
| Stat | Rules |
|---|---|
| Gravitational pull | A tug effect pulling the ship (user) toward the planet/star. Used in specified zones |
| Space objects | Threats to the ship. Used in special events and specified zones |
| Solar flares | Wave-shaped threats; activate when the user reaches the Sun |

---

## 4. CINEMATICS (HTML animations) — Phase 3 subset

Each cinematic plays full-screen over the game, adapts to phone, tablet and laptop, and returns control to the game when it ends. Replace the placeholder with the full code of the animation.

### 4.1 Planet-to-planet travel animation
- **Source:** https://onecompiler.com/html/459ak3ykh
- **Trigger:** plays on every trip between planets (Earth→Moon, Moon→Mars, Mars→Asteroid Belt, Asteroid Belt→Jupiter, Jupiter→Saturn, Saturn→Uranus, Uranus→Neptune, Neptune→Venus, Venus→Mercury). It repeats each time the user starts a trip. The Mercury→Sun trip uses its own animation (4.2, delivered in Phase 4).

```html
<!-- PASTE THE FULL CODE OF ANIMATION 4.1 HERE -->
```

---

## OPEN QUESTIONS relevant to this phase
1. **Missing distances:** Neptune→Venus and Mercury→Sun are not defined (Mercury→Sun could use 57.9 million km, the average distance from the Sun). Until answered, mark them as configurable values.
2. **Energy received** by Earth and the Sun is not specified. Until answered, treat Earth as moderate and keep it configurable.
3. **Travel animation scope:** this prompt assumes the generic animation plays on every trip except Mercury→Sun.
4. **Helium-3:** one note says it cannot be used until Neptune; another says it is used at Mercury with the last upgrade. Keep the unlock point configurable.
