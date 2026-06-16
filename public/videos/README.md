# Hero black-hole video

The homepage hero (`src/components/BlackHoleBackground.jsx`) looks for a looping
cinematic black-hole clip at these two paths and plays the first one the browser
supports:

- `public/videos/blackhole.webm` — preferred (smaller; VP9 or AV1)
- `public/videos/blackhole.mp4` — fallback (H.264, broad support)

Until you drop the files in, the component renders an **animated CSS fallback**
(a slowly spinning accretion-ring + starfield), so the page still looks like a
black-hole environment — it just isn't the full video.

## What to add

A seamless **looping** clip, dark, with the black hole roughly **centre-right**
(the headline sits on the left over a darkened area). It's served as a muted,
autoplaying background, so:

- Keep it short (~8–20s) and loop-friendly (the end should blend into the start).
- Target a small file size — it's a background, not the subject. Aim < ~6–8 MB
  for the `.webm`. Heavily compressed is fine; the component darkens it anyway
  (`filter: brightness(0.5)`).
- 1920×1080 (or wider) is plenty; `object-fit: cover` handles the crop.

## Converting / compressing (ffmpeg)

```bash
# from a source mp4 → web-friendly mp4 (H.264)
ffmpeg -i source.mp4 -vf "scale=1920:-2" -c:v libx264 -crf 28 -preset slow -an -movflags +faststart blackhole.mp4

# → webm (VP9), usually much smaller
ffmpeg -i source.mp4 -vf "scale=1920:-2" -c:v libvpx-vp9 -crf 34 -b:v 0 -an blackhole.webm
```

`-an` strips audio (the video is muted anyway). Drop both files in this folder
and commit them — Vercel serves `/public` at the site root, so they resolve at
`/videos/blackhole.webm` and `/videos/blackhole.mp4`.
