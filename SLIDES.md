# Editing slides

The slideshow reads from [slides.json](slides.json) — a plain JSON array. Edit
that file to add, remove, or reorder slides. No other file needs to change.

Order in the array is the order the slides play in.

`slides.json` holds this box's real IPs/ports and is gitignored (each venue's
addresses differ). On a fresh checkout, copy [slides.json.example](slides.json.example)
to `slides.json` and fill in your apps.

## Fields

| Field | Required | Notes |
|---|---|---|
| `name` | yes | Product name, shown as the big headline on the slide. |
| `tag` | yes | Short category label shown above the name. |
| `description` | yes | One or two sentence pitch shown under the name. |
| `image` | no | Path to a screenshot, relative to the site root (e.g. `assets/images/CDMS.png`). Any size/shape works — it gets framed and scaled automatically. Leave as `""` if you don't have one yet; a placeholder frame shows instead. |
| `ip` | no | Host/IP of the app. Leave as `""` for apps running on this same box — the page automatically uses whatever address the visitor's browser used to reach this site, so it stays correct no matter what network/room this box is plugged into. Only set this for an app that lives on a *different* machine. |
| `port` | no | Port the app listens on. Required if you're using `ip`/`port`/`path` instead of `url`. |
| `path` | no | Path (and query string) on the app, e.g. `dashboard` or `?compact=true`. A leading `/` is added automatically if you leave it off. Defaults to `/` if omitted. |
| `protocol` | no | `http` or `https`. Defaults to `http`. |
| `url` | no | A full URL, used as-is — for apps that aren't on the local network at all (a real external domain, e.g. the ERP). If set, this wins over `ip`/`port`/`path`. Leave as `""` (or `"TBD"`) if the app isn't live yet — the slide shows "Coming soon" instead of a live link. |

Use **either** `url` (full address, for real external systems) **or**
`ip`/`port`/`path` (for demo apps) — not both.

## Adding a slide

Copy an existing `{ ... }` block, add a comma after the one before it, and
fill in the fields.

For an app running on this same box (most demos):

```json
{
  "name": "New Product Name",
  "tag": "Category",
  "description": "What it does, in a sentence or two.",
  "image": "assets/images/new-product.png",
  "ip": "",
  "port": "1234",
  "path": "/"
}
```

For a real external app (its own domain, not this box):

```json
{
  "name": "New Product Name",
  "tag": "Category",
  "description": "What it does, in a sentence or two.",
  "image": "assets/images/new-product.png",
  "url": "https://example.com/app"
}
```

Drop the screenshot file into `assets/images/` first, then point `image` at it.

## Removing a slide

Delete its `{ ... }` block (and the comma that separated it from its
neighbor).

## Common mistakes

JSON is stricter than JS — a couple of things trip people up:

- Every field name and text value needs double quotes (`"like this"`), not
  single quotes.
- No trailing comma after the last field in a block, or after the last block
  in the array.
- If you're not sure the file is still valid, run:
  `python3 -m json.tool slides.json` — it prints an error with a line number
  if something's off, and reprints the file if it's fine.

Reload the page (or just wait for it to refresh) to see changes — nothing
needs to be rebuilt or restarted.

## Editing the logo and event info

The footer's logo and event line ("Tech Show · Sept 23, 2026 · Sequoia
Conference Center, Eureka") come from [site.json](site.json), so the same
site can be reused for a different event just by editing this file — no
HTML changes needed.

| Field | Notes |
|---|---|
| `logo` | Path to the logo image, relative to the site root (e.g. `assets/logo/biztech.png`). |
| `logoAlt` | Alt text for the logo image. |
| `eventName` | Shown in bold, first in the footer line. |
| `eventDate` | Shown after the event name. |
| `eventLocation` | Shown last in the footer line. |

The same JSON rules from above apply here too (double quotes, no trailing
commas).
