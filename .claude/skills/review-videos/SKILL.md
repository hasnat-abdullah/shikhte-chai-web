---
name: review-videos
description: Finish the new YouTube uploads that sync-videos added (topic, English title, thumbnails) so they can be published. Use when the user mentions new videos, the weekly sync pull request, or entries marked "review" in videos.json.
---

# Review new videos

1. List pending entries: `node -e "const d=require('./src/data/videos.json');console.log(d.videos.filter(v=>v.review))"`.
   If there are none, say so and stop.
2. Hand the work to the `content-curator` subagent (it knows the topic rules and the mental-health wording rules).
3. Check its edits with `git diff src/data/videos.json`: every changed entry has a sensible `cat`, an English `en` title and no `review` flag, unless the curator explained why it held one back.
4. `npm run thumbs` if any new id has no files in `public/thumbs/`, then `npm run verify`.
5. Tell the user which videos are ready, which were held back and why. Offer `/ship` to open a pull request.
