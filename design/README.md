# Design sources

Source material for generated site assets. Nothing in this folder is deployed.

## `profile_photo.jpg`

The original portrait. Two kinds of assets are derived from it.

### Display photos (About section)

```sh
convert design/profile_photo.jpg -resize 1400x -strip -quality 80 src/assets/images/profile-1400.webp
convert design/profile_photo.jpg -resize 800x  -strip -quality 80 src/assets/images/profile-800.webp
```

### Particle density map (hero portrait)

`src/assets/images/portrait-density.png` is a 320px grayscale map that the WebGL field
samples to place particles: **dark = dense**, white = empty. It is the photo with the
background removed (a hand-traced silhouette polygon, plus a sky threshold away from the
face), the subject darkened so even the bright face gets particles.

```sh
convert design/profile_photo.jpg -resize 400x -colorspace Gray gray.png

# Silhouette, traced in 400x360 space (face profile follows the forehead, nose, lips and beard).
POLY="77,360 80,300 92,262 100,240 113,215 108,180 106,140 116,105 128,85 140,70 165,55 200,47 \
227,50 249,70 250,75 262,95 269,110 272,117 270,125 272,130 286,144 281,149 277,152 275,160 \
283,167 284,172 287,186 282,195 267,199 250,198 234,210 230,220 242,226 262,236 285,252 300,275 \
308,300 313,330 316,360"
convert -size 400x360 xc:black -fill white -draw "polygon $POLY" -blur 0x0.7 mask.png

# Outside the face, also drop anything as bright as the sky.
convert gray.png -threshold 72% -negate notsky.png
convert -size 400x360 xc:black -fill white -draw "rectangle 222,68 296,226" facebox.png
convert notsky.png facebox.png -compose Lighten -composite keep.png
convert mask.png keep.png -compose Multiply -composite -morphology Open Disk:1 -blur 0x0.6 person.png

# Darken the subject, whiten everything else, downsize.
convert gray.png -fx "u*0.62" darkened.png
convert darkened.png \( person.png -negate \) -compose Lighten -composite \
  -resize 320x -strip src/assets/images/portrait-density.png
```

The particle shape is mirrored in code so the portrait faces into the page.

## `public/og-image.jpg`

A 1200×630 capture of the hero after the intro finishes, taken with headless Chromium.
