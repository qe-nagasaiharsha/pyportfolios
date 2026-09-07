# Course Structure page — parked 7 Sep 2026

The `/course` page was taken down before go-live and replaced with a
coming-soon holding page. **Nothing was deleted.** Both files it needs are
here verbatim, so restoring is a copy-back rather than a rewrite.

| File here | Goes back to |
|---|---|
| `page.tsx` | `site/src/app/course/page.tsx` |
| `course.ts` | `site/src/lib/course.ts` |

## What it contained

A structured 7-module, 28-lesson course — roughly 9 hours — cross-linked to the
runnable case studies, with Module 1 free. The page had a hero, a module-by-
module breakdown with per-lesson minutes, and a call to action.

`course.ts` holds the whole curriculum: every module, every lesson, its
duration, and the article each lesson links to. The three totals shown on the
page (`MODULE_COUNT`, `LESSON_COUNT`, `TOTAL_MINUTES`) are derived from that
array, not typed by hand, so they stay correct if the curriculum changes.

## To restore

```bash
git mv retired-pages/course/page.tsx   site/src/app/course/page.tsx
git mv retired-pages/course/course.ts  site/src/lib/course.ts
```

Then delete the holding page that replaced it (`site/src/app/course/page.tsx`
will be overwritten by the first command — check `git status` before
committing) and rebuild.

## Notes

- `course.ts` was imported by the course page and nothing else, so parking both
  together leaves no dangling imports and no dead data in `site/src/lib`.
- The **Course Structure** link in the site navigation was left in place and now
  points at the holding page. If the page is to stay down for long, that link is
  the next thing to decide on.
- Both files are moved with `git mv`, so their full history follows them.
