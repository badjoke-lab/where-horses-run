# Image policy

Status: draft  
Scope: glossary images, track illustrative images, placeholders, metadata, and repository storage

This document defines how images are planned, generated, stored, described, and displayed in Where Horses Run / 競馬どこ？.

---

## 1. Core principle

Images are explanatory assets, not decorative filler.

The purpose of images is to help users understand:

- racing types
- horse types
- racing roles
- track structures
- common official-site terms
- racecourse characteristics

Images should support comprehension. They do not need to be photorealistic.

---

## 2. PNG requirement

Final explanatory images must be PNG.

```text
Use: PNG
Do not use: SVG as final explanatory asset
```

SVG may be used internally for planning or layout placeholders only if needed, but final glossary and track explanatory assets should be PNG.

---

## 3. Glossary images

Each glossary term should eventually have at least one explanatory PNG image.

Initial v0 does not need to generate all images. It only needs the data fields and page slots.

### 3.1 Initial glossary image fields

```ts
type GlossaryImage = {
  src: string;
  alt_en: string;
  alt_ja?: string;
  image_type: "generated_png" | "placeholder";
  status: "planned" | "generated" | "approved";
};
```

### 3.2 Glossary image statuses

| Status | Meaning |
|---|---|
| planned | image is planned but not created |
| generated | image exists but still needs review |
| approved | image is accepted for public use |

### 3.3 Initial priority terms

Prioritize images for terms where visual explanation matters most.

```text
Harness racing
Trotting
Pacing
Arabian racing
Quarter Horse racing
Banei racing
Racecourse
Racecard
Post time
Jockey
Driver
Trainer
Starting gate
Draw
Track surface
```

---

## 4. Track illustrative images

Track pages may later include generated illustrative PNGs that explain a racecourse's characteristics.

These images are not official venue photos.

### 4.1 Track image fields

```ts
type TrackImage = {
  src: string;
  alt_en: string;
  alt_ja?: string;
  image_type: "illustrative_generated_png" | "placeholder";
  is_official_photo: false;
  note_en: "Illustrative image. Not an official venue photo.";
  note_ja: "説明用のイメージ画像です。公式写真ではありません。";
  status: "planned" | "generated" | "approved";
};
```

### 4.2 Track image purpose

Track images should explain broad characteristics, for example:

```text
Obihiro: straight banei course with slope concept
Sha Tin: large racecourse near mountains, general concept
Meydan: modern large grandstand and wide racing surface, general concept
Hipódromo Chile: urban South American dirt-track concept
Maroñas: South American racecourse concept
```

### 4.3 Track image caption

Every track illustrative image must show this caption or locale equivalent.

English:

```text
Illustrative image. Not an official venue photo.
```

Japanese:

```text
説明用のイメージ画像です。公式写真ではありません。
```

---

## 5. Image content rules

### 5.1 Required qualities

Images should be:

- clear
- understandable at small sizes
- useful for explaining the term or track concept
- neutral in tone
- free of text-heavy labels when possible
- stored with meaningful filenames
- paired with alt text

### 5.2 Avoid in generated images

Avoid:

- official logos
- sponsor boards
- trademarked signage
- real named horses
- real named riders or drivers
- exact recreation of venue photos
- copying official or commercial images
- depicting a generated track image as an official photo

### 5.3 Human and animal depiction

Generic people and horses are acceptable when needed to explain concepts like jockey, driver, or harness racing.

They should be generic, non-identifiable, and not based on real named individuals or horses.

---

## 6. Image style direction

Use a consistent explanatory illustration style.

Recommended:

```text
clean illustrated PNG
clear subject
simple background
readable at card size
not overly detailed
not photorealistic unless necessary
```

Avoid:

```text
busy poster style
sports betting style
heavy text overlays
fake official signage
brand-like logos inside the image
```

---

## 7. File locations

Image assets should live under `public/assets/`.

```text
public/assets/
  glossary/
    placeholders/
    harness-racing.png
    trotting.png
    driver.png

  tracks/
    placeholders/
    obihiro.png
    sha-tin.png
```

Initial placeholders can be omitted if the UI can render planned image states without files.

---

## 8. Naming rules

Use lowercase kebab-case filenames.

```text
harness-racing.png
quarter-horse-racing.png
banei-racing.png
sha-tin.png
hipodromo-chile.png
```

Do not use:

```text
IMG_001.png
new-image-final.png
trackpic.png
```

---

## 9. Alt text

Alt text is required for every public image.

### 9.1 Glossary alt text

Should describe the concept plainly.

Example:

```text
A harness racing horse pulling a two-wheeled sulky with a driver behind it.
```

Japanese:

```text
繋駕速歩競走で馬が二輪車を引き、後方にドライバーが乗っている説明画像。
```

### 9.2 Track alt text

Should describe the broad illustrative scene and avoid claiming it is official.

Example:

```text
Illustrative view of a large racecourse with a wide racing surface and mountain backdrop.
```

Japanese:

```text
山を背景にした大規模競馬場の特徴を説明するイメージ画像。
```

---

## 10. Captions

Captions should be shown when clarification is useful.

Required for track illustrative images:

```text
Illustrative image. Not an official venue photo.
```

Optional for glossary images:

```text
Explanatory image for harness racing.
```

---

## 11. Lazy loading and dimensions

Images should use lazy loading unless they are the main above-the-fold image.

Implementation guidance:

```html
<img
  src="/assets/glossary/harness-racing.png"
  alt="A harness racing horse pulling a two-wheeled sulky with a driver behind it."
  loading="lazy"
  width="1200"
  height="800"
/>
```

Width and height should be stored or known to reduce layout shift.

---

## 12. Placeholder behavior

If an image is planned but not generated, the page should show a small planned state.

Example:

```text
Image planned
An explanatory PNG will be added in a later update.
```

Do not show broken image icons.

Do not include empty image boxes that look like loading failures.

---

## 13. Review process

Before an image is marked `approved`, check:

- PNG format
- correct filename
- alt text exists
- no official logo or signage
- no copied venue photo composition
- not misleading as an official photo
- caption is present for track images
- image helps explain the page content

---

## 14. Repository policy

Images can be committed directly to the repository if file size remains reasonable.

Initial guidance:

```text
prefer under 500 KB per image when possible
avoid very large PNGs
optimize before committing
```

If image volume becomes large later, revisit storage strategy. v0 does not use R2 or external storage.

---

## 15. v0 implementation scope

v0 must include:

- image fields in data model
- glossary image slot support
- track image slot support
- planned image state
- alt/caption requirements in docs

v0 does not need:

- final PNG for every glossary term
- generated PNG for every track
- image generation workflow
- external image storage

---

## 16. Acceptance criteria

The image policy is satisfied when:

- data model supports glossary and track images
- pages can render generated, approved, or planned image states
- PNG is the final explanatory image format
- SVG is not used as final explanatory asset
- track images show illustrative disclaimer captions
- alt text is required when image src exists
- pages do not break when images are not yet generated
- repository has a clear location for future assets
