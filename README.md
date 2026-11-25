# 🌍 LifeVerse

**Your Life. Your Decisions. Your Consequences.**

LifeVerse is a complete life-simulation game that runs entirely in your browser. Be born, grow up, study, work, fall in love, build (or lose) a fortune, raise a family, and pass your legacy to the next generation. Every year is one tap — and every choice echoes.

**▶ Play it: https://yutfi.github.io/GitHub-Life/**

No account, no backend, no tracking. Saves live in your browser's local storage.

---

## Features

| Area | What you get |
| --- | --- |
| **Character creation** | Name, gender, country & city (14 countries with real wage, price, tax, healthcare and life-expectancy differences), birth year 1940–2026, family wealth tier, household type, random personality traits and rolled stats, difficulty, save slot |
| **Aging engine** | Yearly progression through baby → child → teen → young adult → adult → senior, with age-appropriate activities, health decline and mortality that depends on country, health, conditions and luck |
| **Education** | Kindergarten through doctorate, grades and effort, admission chances, scholarships, student loans, dropping out and returning |
| **Careers** | 50+ careers with qualifications, interviews, promotions, reviews, raises, layoffs, firings, retirement and pensions — plus founding and selling your own business |
| **Finance** | Cash, savings, tax brackets, loans, credit card & credit score, index funds / stocks / bonds / crypto, retirement fund, renting, buying and renting out property, vehicles, lifestyle, charity, lottery, bankruptcy, inflation and recessions |
| **Relationships** | Friends, family, romance with compatibility, marriage (with prenups), divorce, children (natural or adopted), trust and closeness that evolve over time |
| **Children's love lives** | Grown-up children start dating and eventually ask for your blessing. Bless them, pay for the wedding, ask them to wait, quietly investigate the partner, or forbid it, and live with the consequences: weddings, grandchildren, divorces, estrangement and reconciliation. The partner's real character is hidden unless you are perceptive or investigate. Your heir inherits their actual spouse |
| **Events** | 330+ event templates (including everyday money, housing, work and family-care situations) with multiple choices, random outcomes and long-term consequences; follow-ups, cooldowns and a no-repeat system keep every life fresh |
| **Generations** | Death summary with legacy score, estate settlement (debts, inheritance tax, charity, heirs), continue as one of your children, dynasty history and a family tree |
| **Achievements** | 50+ achievements that unlock automatically across every life you play |
| **Saves** | Autosave, 5 slots, JSON export/import (file or paste), automatic backup recovery for corrupted saves, full reset |
| **Settings** | Dark/light/system theme, reduce motion, autosave, confirmations, default difficulty and live balance tuning (mortality, income, expenses, event rate, market volatility) |

Money is stored internally in USD and shown in your country's currency, so a salary in Nigeria, Japan or Switzerland feels right for the place and the era.

## Tech stack

- **React 19 + TypeScript** (strict) on **Vite**
- **Tailwind CSS v4** with semantic CSS variables for the dark/light themes
- **Zustand** for UI state, **React Router** (`HashRouter`) for navigation
- **Lucide** icons; charts and avatars are hand-rolled SVG (no chart library)
- **Vitest** for engine tests

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine + content tests
npm run build      # type-checks, then builds to dist/
npm run preview    # serve the production build
```

Requires Node 20+.

## Deploying to GitHub Pages

The workflow in `.github/workflows/deploy.yml` tests, builds and deploys on every push to `main`.

1. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions** (once).
2. Push to `main`. The site appears at `https://<user>.github.io/<repo>/`.

The app uses a relative Vite `base` (`./`) together with `HashRouter`, so it works from any sub-path or custom domain without extra configuration, and deep links survive a refresh.

## Architecture

```
src/
  engine/            Pure TypeScript game logic — no React, fully testable headlessly
    config.ts          All balance numbers (BALANCE) and default tuning multipliers
    types.ts           Shared data model (GameState, Character, Person, …)
    aging.ts           ageUp(): the yearly pipeline
    education.ts career.ts finance.ts relationships.ts travel.ts activities.ts
    kids.ts            Adult children: dating, marriage proposals, divorce, estrangement
    events.ts          Event engine: eligibility, weighting, effects DSL, resolution
    family.ts          Death, estate, heirs, continuing as a child, family tree
    achievements.ts    Achievement definitions + unlock checks
    save.ts            Slots, backups, migration/validation, import/export
    sim.ts             Bot player used by the tests to simulate whole lives
    data/              Countries, names, traits, careers/degrees, and event templates
  store/useGame.ts   Zustand store: clone → run engine action → commit (snapshot, achievements, autosave)
  components/        Reusable UI (cards, modals, stat bars, charts, avatar, toasts, shell)
  screens/           Menu, new life wizard, dashboard, action panels, journal, stats, family, death, saves, settings
```

**Design rules**

- The engine never touches the DOM. UI code calls an engine function on a *clone* of the state and commits the result, so a failed action can never leave a half-applied state.
- All randomness goes through a seedable RNG (`engine/rng.ts`), which makes lives reproducible in tests.
- Balance lives in `config.ts` and in the player-adjustable `tuning` multipliers — not scattered through the code.

## Adding content

Everything is data-driven. You can register new content without touching the engine:

```ts
import { registerContent } from './engine/game';
import { ev, ch, o } from './engine/kit';

registerContent({
  events: [
    ev('found_a_cat', 'life', [6, 90], '🐈', 'A Stray Cat', 'A scruffy cat follows you home.', [
      ch('Adopt it', [o('You have a new best friend.', { happiness: 6, money: -60 })]),
      ch('Walk on by', [o('You carry on with your day.')]),
    ]),
  ],
});
```

`registerContent` also accepts `activities` and `achievements`. See `src/engine/data/events/` for hundreds of examples, including conditions (`when`), weighted outcomes, scheduled follow-ups and relationship effects.

## Testing

`npm test` validates every event template (unique ids, valid choices and age ranges), then simulates dozens of full lives and multi-generation dynasties with a bot player, asserting that no value ever becomes `NaN`, that characters die at plausible ages, and that saves round-trip losslessly.

## Disclaimer

LifeVerse is an original game inspired by the genre of life simulators. All names, characters and content are fictional. Economic figures are stylised for gameplay, not financial advice.
