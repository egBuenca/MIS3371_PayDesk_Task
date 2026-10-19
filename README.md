# PayDesk — Task Package
### Build a modern transaction web app in two layers

A hands-on task for the JavaScript stretch of MIS 3371 (Section 20300). Students build a
single-page payment desk: pick an account, enter a payee and an amount, and the app decides
on the spot whether the payment **posts**, is **held**, or is **declined** — then shows a
receipt and adds it to a running ledger. No page reload, no server.

The point of the task is the line between two files:

| | Owns | Never does |
|---|---|---|
| `style.css` | How it looks, including what "wrong", "held" and "declined" look like | Decide anything |
| `app.js` | What it does and what it decides | Mention a colour or a pixel |

---

## What's in here

| Folder | What it is |
|---|---|
| `task/MIS3371_Task_Build_PayDesk.pdf` / `.docx` | The 13-page student brief, with screenshots of the finished app |
| `task/MIS3371_PayDesk_Demo_Walkthrough.pdf` / `.docx` | **Instructor script.** 16 steps for building it live — say / type / show / check |
| `starter/` | **Hand this out.** Finished `index.html`, plus `style.css` with 9 TODOs and `app.js` with 12 |
| `reference/` | The working app. Instructor only |
| `shots/` | The seven screenshots, captured from the running app |
| `shots.js` | The script that drives the app in a browser and takes them |

Open `reference/index.html` in any browser. No build step, no install, no server.

---

## The rules the app enforces

| Condition | Outcome |
|---|---|
| Amount empty, zero, negative, not a number, or over $10,000 | Rejected at validation |
| Payee missing or over 40 characters | Rejected at validation |
| Amount over the account balance | DECLINED |
| Account over $25,000 for the day | DECLINED |
| Same payee and amount within 60 seconds | HELD — possible duplicate |
| Amount $5,000 or more | HELD — review required |
| Everything else | POSTED |

The duplicate rule is Week 13's topic arriving early, and the daily limit is the first rule
students meet that **cannot** be answered by looking at the form alone — it needs the history.

---

## Why no PHP

An earlier draft of this had a PHP layer doing the deciding. It was dropped because the course
never uses PHP: server-side work in this syllabus arrives in Week 11 as AWS Lambda behind API
Gateway. Teaching a second server language first would be a detour.

The structure still sets that up. Everything in section 2 of `app.js` — `validate`,
`applyRules`, `processPayment` — takes values in and returns values out, touching no part of
the page. When Week 11 comes, that section moves to a Lambda function with almost no edits, and
the fact that it moved cleanly is the proof the layers were right.

Worth saying out loud to students once: client-side checks are for **usability**, not security.
A real system re-checks everything on the server, because anything in the browser can be edited.

---

## The layer view

The toggle in the header outlines every region and labels which layer owns it — blue for CSS,
purple for JavaScript. It is built from one CSS rule set and one line of JavaScript, it is
stretch task S3, and it makes the whole point of the task visible in one click.

---

## Rebuilding

```bash
export NODE_PATH=$(npm root -g)
node shots.js              # drives the app in Chromium, writes shots/
node task/build_task.js    # the student brief, screenshots embedded
python3 build_steps.py     # pulls the demo snippets out of the app -> steps.json
node build_walkthrough.js  # the instructor walkthrough
```

`build_steps.py` extracts every code block in the walkthrough from `reference/` by function
name and CSS selector, and fails if one is missing — so the script can never show code that
is not in the working app.

`shots.js` fails the build if the page throws any JavaScript error, so the screenshots in the
brief can only ever be of a working app.
