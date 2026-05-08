---
config_for: course
last_updated: 2026-05-08
authored_by: JLW
sd_modal_path: Courses → Add Course → Course Details
source: Zuri Training Videos project instructions §3.2 + §5.1 (verbatim shape)
---

# Module Config — Course

Lifted verbatim from the Zuri Training Videos project. Track-specific vocabulary lock applies — Service Bureau / Member track OR Tax Prep Pro / Provider track. Pick one when authoring an instance.

## Frontmatter additions for this type

```yaml
# Add these to the base canonical-cu-sd-sync.md §5 frontmatter:
body_type: course
lms_number: {N}
course_title: "{verbatim title}"
parent_course_lms_number: {N | null}
```

## SD Modal — field-by-field config

These values map 1:1 to the SuiteDash Course Details modal (Courses → Add Course → Course Details). Build the course in SD by walking this doc top to bottom.

### Course Title (required)

Plain text, single line.

```
{course_title}
```

### Summary (optional)

Plain text, 1 sentence.

```
{TODO: 1-sentence summary}
```

### Course Description (rich text)

Supports headings, bold, italic, strikethrough, lists, links, images, tables, code blocks.

{TODO: 2–4 paragraphs}

### Course Thumbnail Image (optional)

Filename of an existing asset OR a description of an image to be created.

{TODO: filename or description}

---

## Module-level config (only when this doc creates a new module under the course)

If this doc is just the parent course shell, leave this section as `_n/a — module created in a separate doc_`.

### Module Title (required)

```
Module {NN}: {Title}
```

### Module Description (rich text)

{TODO: 1–2 paragraphs}

---

## Lesson breakdown

### Lesson {N.N}: {Lesson Title}

**Block sequence:**

1. **Text Block** — content: `{TODO}`
2. **Video Block** — URL: `[VIDEO_URL — Module {NN} Lesson {N}]`
3. **Checklist** — items:
   - [ ] {TODO}
4. **Button Block** — label: `{Continue to Lesson {N+1}}`, URL: `{next lesson URL or anchor}`
5. **Separator**

(Repeat for every lesson.)

---

## Assets needed

- Thumbnail image: {TODO}
- Companion 1-page PDF: {TODO}
- Other: {TODO}

---

## Vocabulary lock (REMOVE the line that doesn't apply)

- **Service Bureau / Member track:** Member (never Mentee or User). Bureau Operator (never Mentor).
- **Tax Prep Pro / Provider track:** Provider, Taxpayer, Order, Phase.

---

## Change log

| Date | Change | Editor |
|------|--------|--------|
| {today} | Initial scaffold from `module-config/course.md` | {editor} |
