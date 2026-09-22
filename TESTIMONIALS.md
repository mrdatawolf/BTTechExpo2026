# Editing testimonials

The bottom third of the slideshow shows a rotating testimonial band, read from
[testimonials.json](testimonials.json) — a plain JSON array, edited the same
way as [slides.json](slides.json) (see [SLIDES.md](SLIDES.md)).

Testimonials play in a shuffled order and advance every time the slide
changes (autoplay or manual navigation). The order reshuffles each time it's
been fully shown once. The number of testimonials doesn't need to match the
number of slides — they rotate independently.

If `testimonials.json` is empty (`[]`) or missing, the band disappears
entirely and slides use the full height, same as before this feature existed.

## Fields

| Field | Required | Notes |
|---|---|---|
| `quote` | yes | The testimonial text. Quotation marks are added automatically — don't include them. |
| `author` | yes | Who said it. |
| `role` | no | Their job title, e.g. `"Operations Manager"`. |
| `company` | no | Their company, e.g. `"Acme Co."`. |

`role` and `company` are combined after the name, e.g. "Jane Doe — Operations
Manager, Acme Co." Leave either out if you don't have it — only what's
present is shown.

## Adding a testimonial

```json
{
  "quote": "This cut our onboarding time in half.",
  "author": "Jane Doe",
  "role": "Operations Manager",
  "company": "Acme Co."
}
```

Add a comma after the block before it. Same JSON rules as slides.json apply
(double quotes, no trailing commas) — validate with:
`python3 -m json.tool testimonials.json`

## Removing a testimonial

Delete its `{ ... }` block (and the comma that separated it from its
neighbor).

Reload the page (or wait for it to refresh) to see changes — nothing needs
to be rebuilt or restarted.
