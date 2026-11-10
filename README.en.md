# Schulte Trainer

[简体中文](README.md)

A browser-based Schulte number trainer. Practice with a timer or print the current board as a single A4 worksheet.

## How to use

1. Open training settings in the upper left and pick a layout, level, and colors.
2. Select a player in the top bar, or enter a name and press Enter to add one. Rounds without a selected player are saved under Guest.
3. Select the numbers in ascending order. The timer starts at 1 and the result is saved when you select the final number.
4. Open the scoreboard from settings to see the player, date, layout, level, and elapsed time.
5. Choose Print and select A4 portrait in the browser dialog. The browser print shortcut works too. The worksheet retains the current arrangement and restores completed numbers.

| Layout | Geometry |
| --- | --- |
| Classic grid | Equal-width, equal-height squares |
| Irregular grid | Variable row heights and cell widths with adaptive labels |
| Honeycomb | Offset hexagons |
| Circle | Round cells on concentric rings |
| Circle + honeycomb | Hexagons clustered within a circular outline |
| Circle + irregular | Polygonal cells and adaptive labels inside a circle |

Every layout has levels 3–7 with 9, 16, 25, 36, or 49 numbers. The level denotes the number of cells in this app. Players, scores, and language preference are stored in the current browser's localStorage.

## Development

Use Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
```

The stack is Vite, React, TypeScript, Tailwind CSS, Jest, and Day.js. Deploy the production output in `dist/` to any static host.
