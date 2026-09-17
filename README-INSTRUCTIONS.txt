Upload/replace these files in your local project first:

- tina/fields/permalink.ts
- tina/collections/blog.ts
- tina/collections/page.ts
- src/lib/permalinks.ts

Local destination root:
C:\Users\ADMIN\Desktop\Astro\tina-blog\

After replacing, run:
pnpm exec tinacms build --skip-cloud-checks -c "astro build"

Then create/upload your normal firstfornews-node-update.zip including full dist/ and these changed files.
