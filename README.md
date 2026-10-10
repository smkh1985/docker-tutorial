# Docker, one small step at a time

A hands-on, bilingual (English / فارسی) Docker course. Every lesson teaches **one** thing, with real commands and real output, checklists that save your progress in the browser, and tooltips that explain every part of every command.

**Start here:** open `index.html` in your browser (or the GitHub Pages site), then begin with **★ Why Docker?**

## Lessons

| # | Lesson |
|---|---|
| ★ | Why Docker? (animated introduction) |
| 0 | Install Docker |
| 1 | Images |
| 2 | Run a container |
| 3 | Run in the background |
| 4 | Open it in the browser |
| 5 | Logs |
| 6 | Go inside a container |
| 7 | Run a command in a new container |
| 8 | Keep your data (volumes) |
| 9 | Named volumes, with a real database |
| 10 | Edit live with a shared folder |
| 11 | Settings with environment variables |
| 12 | Restart policies |
| 13 | Networks |
| 14 | Docker Compose |
| 15 | Compose: an app and its database |
| 16 | Save a container as an image |
| 17 | Your first Dockerfile |
| 18 | Tags and versions |
| 19 | Package your own program |
| 20 | Copy a whole project |
| 21 | System packages and a safer image |
| 22 | Your own API + database |
| 23 | Frontend + backend + database |

## Example files

The `examples/` folder has the finished files for every lesson where you write files (Dockerfiles, `compose.yaml`, app code). If you get stuck, compare them with yours, or run them directly, e.g.:

```bash
cd examples/22-api-db
docker compose up -d
```

The `db.env` files contain a **practice** password (`secret`). Never use passwords like that for anything real.

## Requirements

- Linux (Ubuntu) is used in the lessons; Lesson 0 also covers macOS and Windows (Docker Desktop).
- Lessons were written and tested with Docker 29.
