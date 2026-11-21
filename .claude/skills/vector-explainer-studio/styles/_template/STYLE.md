# <Style name>

Copy this folder to `styles/<slug>/` and fill every section. A style is done when a
reference video in `src/videos/<id>/` renders and passes `scripts/build.sh`.

## Use it for / not for
What kind of story or data this look serves, and what it should never be used for.

## Look
Palette tokens (add them to `src/theme.ts`), materials, how depth is shown, typography.

## Characters
Which component, its signature details, which expressions and poses the style relies on.

## Motion and acting
Default easing, how impacts land (hit-stop? shake?), limb timing (smooth or `limbFps`).

## Camera
Which moves the style uses (pan, push-in, cut, fade) and its one signature shot.

## Text on screen
What is allowed on screen (headlines? badges only?) and how long it holds.

## Sound
Which SFX and where; music level under voice.

## Components
Table of the components this style uses and their key props.

## Pitfalls found in QA
Every defect a render of this style has shown, as a check for the next render.
