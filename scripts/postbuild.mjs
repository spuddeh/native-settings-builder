// Copies the published schema and docs into dist so they are served on Pages
// at stable URLs (…/schema/settings.schema.json, …/docs/prior-art-review.md).
import { cpSync } from 'node:fs'

cpSync('schema', 'dist/schema', { recursive: true })
cpSync('docs', 'dist/docs', { recursive: true })
cpSync('examples', 'dist/examples', { recursive: true })
console.log('postbuild: copied schema/, docs/, examples/ into dist/')
