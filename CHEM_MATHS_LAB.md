# Gas Lab: Particles to Probability (Chemistry x Maths)

## What it teaches
- Chemistry: Ideal Gas Law (P·A = N·kT), Boyle's law, temperature and molecular speed.
- Maths: probability density, the Maxwell-Boltzmann (Rayleigh) distribution, area under a curve = 1,
  integration for the mean speed, differentiation for the most probable speed, square-root scaling.

## What the student does
1. Moves sliders for temperature, volume (piston) and particle count.
2. Sees live particles, a speed histogram, and the theory curve on top of it.
3. Compares measured pressure (counted from wall impacts) with the predicted N·kT/A.
4. Plays the "hit the target pressure" challenge.

## Files
- `chem-maths-lab/ChemMathsLab.jsx`: self-contained React component (default export, optional `onBack` prop).
- `docs/demo-standalone.html`: full standalone demo site (characters, Boyle's-law recorder, badges, quiz). Open in a browser.

## Integration (verify against the repo before copying)
1. Put the component in `client/src/features/chem-maths-lab/`.
2. Register a tile in `tiles.js`. Copy the shape of an existing entry exactly (key, name, subtitle, color, category).
3. Add the one-line mapping the repo README describes so the tile opens this component.

## Model notes
2D gas, unit mass, no particle-particle collisions (they do not change the equilibrium distribution).
Temperature change rescales velocities by sqrt(T_new/T_old). Pressure = total wall impulse / (time x perimeter).
