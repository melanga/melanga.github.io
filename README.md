# melanga.github.io

Personal site of [Melanga Dissanayake](https://melanga.github.io), a software engineer working
on machine learning, neural networks and mobile & web products.

## Concept: signal from noise

The site plays out like a model being trained. One WebGL particle field runs behind the
whole page and morphs between "embeddings" as you scroll:

| Section     | Layer         | The particles become…                                            |
| ----------- | ------------- | ---------------------------------------------------------------- |
| Intro       | —             | random noise that converges while a training run reports loss    |
| Hero        | —             | a stippled portrait, sampled from a photo                        |
| About       | Input         | a noisy signal resolving into a clean five-strand waveform       |
| Stack       | Hidden layers | a breathing latent-space sphere                                  |
| Work        | Output        | rolling hill-country terrain                                     |
| Contact     | Inference     | the island of Sri Lanka                                          |

Other pieces:

- **Training-run preloader**: epochs, loss curve and accuracy while the portrait converges.
  Plays in full on the first visit of a session and as a quick converge after that.
- **Object-detection cursor**: a reticle that snaps a labelled bounding box, with a
  confidence score, around anything interactive.
- **The stack as a neural network**: technologies (inputs) → domains (hidden layer) →
  projects (outputs), built from live GitHub data. Hover to trace activations; select an
  input to filter the work index. On phones the network turns vertical and the forward
  pass runs top to bottom: technology chips, then the wired graph (tap a domain to trace
  it), then the numbered project list.
- **Scroll-focused statement**: About text comes into focus word by word as you read.
- **Generative fingerprints**: repositories without screenshots get a flow-field cover
  seeded by the repo name.
- Lenis smooth scrolling, word-mask reveals, decoding text, magnetic buttons, sticky
  stacking case studies, a theme switch that wipes out from the toggle (View Transitions),
  and a light "paper" theme.

Everything honours `prefers-reduced-motion`: smoothing, the intro and particle motion are
switched off, and content renders immediately.

## Stack

- Angular 21 (standalone, zoneless, signals)
- Raw WebGL (no 3D library), simplex-noise vertex shaders
- [Motion](https://motion.dev) for DOM animation, [Lenis](https://lenis.darkroom.engineering) for scrolling
- Self-hosted Geist, Geist Mono and Instrument Serif via Fontsource
- Vitest

## Development

```sh
npm start          # dev server at http://localhost:4200
npm run build      # production build → dist/angular-portfolio/browser
npm test           # unit tests (Vitest)
```

Pushing to `main` builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`).

## Editing content

- Personal details (name, email, location, roles): `src/app/core/site.config.ts`
- Featured projects, display names, screenshots, hidden repos: `src/app/core/portfolio-overrides.data.ts`
- Offline fallback projects: `src/app/core/portfolio-fallback.data.ts`
- Technology → domain mapping for the network: `src/app/core/tech-domains.ts`
- Regenerating the portrait assets: [`design/README.md`](design/README.md)

Projects and technologies load from the GitHub API at runtime (cached for 12 hours in
`localStorage`), with the bundled snapshot as a fallback.
