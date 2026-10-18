# How to add a Notebook post

(This file is a note for you. Files starting with _ never appear on the site.)

## 1. Make the text file

Create a new file in this folder (`content/notebook`). Its name becomes the post's web address, so:

- small letters, words joined with dashes, ending in `.md`
- example: `what-nss-taught-me.md` → yoursite.com/notebook/what-nss-taught-me

Easiest way: copy an existing post, rename it, and replace the words.

## 2. Fill in the details at the top

Every post starts with this block, between two `---` lines:

```
---
title: What NSS taught me
date: 2026-11-03
kind: Essay
place: commons
summary: One or two lines. This shows in the Notebook list and when the link is shared.
cover: /notebook/what-nss-taught-me/cover.webp
---
```

- **title**, **date**, **kind**, **summary** are required.
- **date** is always written year-month-day: `2026-11-03`. The newest date shows first.
- **kind** is anything: Essay, Field note, Diary, Short story, Build log…
- **place** (optional) ties it to a place: workshop, studio, commons, arena, press or notebook.
- **cover** (optional) is the big picture at the top. Leave the line out for no picture. If it's a .jpg or .png, it is also the picture people see when the post's link is shared on WhatsApp or LinkedIn (best at 1200 × 630); otherwise they see the Notebook's card.

## 3. Write the post below the details

Leave an empty line between paragraphs. That's all you need for plain writing. Extras:

| You write | You get |
|---|---|
| `## What I learned` | a subheading |
| `> A line worth remembering.` | a big pull quote |
| `> A line worth remembering.` then on the next line `> — Someone` | a quote with who said it |
| `(Written in my first year.)` | a small editor's note, set apart |
| `![Volunteers at the camp](/notebook/what-nss-taught-me/camp.webp "Blood donation camp, 2026")` | an image with a caption (the caption in quotes is optional) |

## 4. Add the images

Make a folder with the same name as the post inside `public/notebook/`, and put the images there:

```
public/notebook/what-nss-taught-me/cover.webp
public/notebook/what-nss-taught-me/camp.webp
```

- In the post, the path starts at `/notebook/…` (leave out `public`).
- .webp, .jpg or .png all work. Keep each image under about 1 MB (2000 px wide is plenty); squoosh.app shrinks them for free.

## 5. Publish

Upload the new `.md` file and the image folder to GitHub (or save and push). The site rebuilds by itself and the post appears in 1–2 minutes: in the Notebook, in search (Ctrl K), and with its own page.

If something is wrong in the details (a missing title, a date written the wrong way), the update stops and the old site stays up. The error message names the file and what to fix.
