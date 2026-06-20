# Circular Dependencies

**None detected** in the internal `@/` import graph.

The codebase uses a clean layered structure:

- Routes/pages import components and `lib/*`
- Components import UI primitives and `lib/utils`
- Actions import schemas, supabase, gamification
- Schemas depend only on Zod
- No file in `lib/actions/` is imported by `lib/supabase/`

Re-run detection after adding cross-imports between action modules or shared client hooks.

```bash
node docs/exploration/extract-graph.js
```
