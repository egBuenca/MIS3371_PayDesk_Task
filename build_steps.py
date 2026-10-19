#!/usr/bin/env python3
"""
Pulls the demo snippets straight out of the finished app, so every block
in the walkthrough is code that is known to run.
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
JS = open(os.path.join(HERE, "reference/assets/app.js")).read()
CSS = open(os.path.join(HERE, "reference/assets/style.css")).read()


def js_fn(name):
    """A top-level function, from its signature to the } in column 1."""
    m = re.search(r"^function %s\(.*?^\}" % re.escape(name), JS, re.S | re.M)
    assert m, "no JS function named %s" % name
    return m.group(0).rstrip()


def js_lines(*needles):
    """Specific single lines, in the order asked for."""
    out = []
    for n in needles:
        found = [l for l in JS.split("\n") if n in l]
        assert found, "no JS line containing %r" % n
        out.append(found[0])
    return "\n".join(out)


def css_rule(selector):
    """One CSS rule, from the selector to its closing brace."""
    m = re.search(r"^%s\s*\{.*?^\}" % re.escape(selector), CSS, re.S | re.M)
    assert m, "no CSS rule for %s" % selector
    return m.group(0).rstrip()


def css_rules(*selectors):
    return "\n\n".join(css_rule(s) for s in selectors)


def css_block(start, end=None):
    i = CSS.index(start)
    j = CSS.index(end, i) if end else len(CSS)
    return CSS[i:j].rstrip()


STEPS = [

 {"id": "0", "mins": 3, "layer": "both",
  "title": "Open the finished app and the three empty files",
  "say": [
    "Start from the end. Open reference/index.html, make one payment, and "
    "let them see what they are aiming at.",
    "Then tick the layer toggle in the header. Blue is CSS, purple is "
    "JavaScript. Say the sentence you will repeat all session: CSS decides "
    "what it looks like, JavaScript decides what is true.",
    "Now close it and open the starter. index.html is finished - nobody "
    "writes markup today. style.css has nine TODOs, app.js has twelve."],
  "code": None,
  "show": "Finished app, then the layer view, then the starter's empty files "
          "side by side in VS Code.",
  "check": "Everyone can open index.html in a browser and see the unstyled "
           "form. If the page is blank, they opened the wrong file."},

 {"id": "1", "mins": 4, "layer": "css", "todo": "C1 + C2",
  "title": "Tokens first, then the page basics",
  "say": [
    "Name every colour once, at the top, and never type a hex code again "
    "below this block.",
    "Ask them why --brand instead of #c8102e in forty places. The answer "
    "is the one-line change when Marketing picks a new red.",
    "box-sizing: border-box on everything is the line that stops padding "
    "breaking your widths. Set it once and forget it."],
  "code": {"lang": "css", "text": css_block(":root {", "/* Dark mode") +
           "\n\n" + css_rule("* ") + "\n\n" + css_rule("body")},
  "show": "Reload. The page is still ugly, but the font and the background "
          "changed - proof the stylesheet is actually linked.",
  "check": "If nothing changed, the <link> tag path is wrong. Open the "
           "Network tab and look for the 404 on style.css."},

 {"id": "2", "mins": 4, "layer": "css", "todo": "C3 + C4 + C5",
  "title": "Layout: a container, a grid, and one card rule",
  "say": [
    "Three rules turn a stack of text into an application.",
    ".wrap centres the content and keeps it off the edges on a phone.",
    ".grid is the two-column split. Point out that 1.05fr and 0.95fr is "
    "just 'the left one slightly wider' - fr units are proportions, not "
    "pixels.",
    ".card is written once and used by every panel on the page. That is "
    "the whole idea of a class."],
  "code": {"lang": "css", "text": css_rules(".wrap", ".grid", ".card")},
  "show": "Reload. The form and the receipt sit side by side in two white "
          "cards. This is the moment it starts looking like software.",
  "check": "Narrow the window hard. It will look wrong - that is C9's job "
           "later, so leave it."},

 {"id": "3", "mins": 4, "layer": "css", "todo": "C6",
  "title": "Make the form controls look like this decade",
  "say": [
    "font: inherit is the single most valuable line here. Without it, "
    "inputs keep the browser's default 13px Arial and look pasted on.",
    "Spend a minute on :focus-visible. Tab through the form with and "
    "without it. Somebody navigating by keyboard cannot use the form "
    "without that ring, and it is two lines."],
  "code": {"lang": "css", "text": css_block(
      'input[type="text"], select {', "/* The state classes")},
  "show": "Tab through the form and watch the focus ring move.",
  "check": "Ask the room to put their mouse down and reach the submit "
           "button with the keyboard only."},

 {"id": "4", "mins": 5, "layer": "js", "todo": "J1",
  "title": "The first function, and the trap inside it",
  "say": [
    "Open the console and run Number('') before showing the function. It "
    "is 0. Let that sit for a second.",
    "So an empty amount box becomes zero, and zero passes any test that "
    "only asks 'is this a number'. That is why the blank check comes "
    "first and the conversion second.",
    "This function takes text and returns a number. It touches nothing "
    "else, which is why we can test it in the console right now."],
  "code": {"lang": "js", "text": js_fn("toAmount")},
  "show": "In the console: toAmount('48.20'), toAmount(''), "
          "toAmount('twelve'). Three answers, three different reasons.",
  "check": "Number.isNaN(toAmount('')) is true. If it is false, the blank "
           "check is missing or in the wrong order."},

 {"id": "5", "mins": 7, "layer": "js", "todo": "J2",
  "title": "Validation: is this data usable at all?",
  "say": [
    "Validation never asks what the company allows. It only asks whether "
    "the request makes sense as data. Keep saying that - it is the idea "
    "the whole task is built on.",
    "Notice it returns an object, not true or false. That is how the page "
    "knows WHICH field to turn red and WHAT to say under it.",
    "Each check returns the moment it finds a problem. Later checks "
    "cannot run on data you already know is broken."],
  "code": {"lang": "js", "text": js_fn("validate")},
  "show": "In the console: validate({account:'CHK-4471', payee:'', "
          "amount:'0', category:'', reference:''}). Three keys come back.",
  "check": "A good request returns {} - an empty object, not undefined.",
  "ask": "Why does this function not know about the account balance?"},

 {"id": "6", "mins": 6, "layer": "js", "todo": "J7 + J8",
  "title": "Read the form, and show the errors",
  "say": [
    "Here is the line between the layers, in two functions.",
    "readForm goes to the page and collects five values. showErrors goes "
    "back to the page and sets text and class names.",
    "showErrors does not choose a colour. It adds the class 'invalid' and "
    "CSS decides what that means. If you ever type a colour in app.js, "
    "stop."],
  "code": {"lang": "js", "text": js_fn("readForm") + "\n\n" +
           js_fn("showErrors")},
  "show": "Nothing visible yet - the classes are being set, but CSS does "
          "not know what they look like. That is the next step, and the "
          "order is deliberate.",
  "check": "In the console: showErrors({payee:'test message'}) and then "
           "inspect the payee input. It has class 'invalid'."},

 {"id": "7", "mins": 3, "layer": "css", "todo": "C7",
  "title": "Now tell CSS what 'wrong' looks like",
  "say": [
    "Three rules, and the invisible work from the last step becomes "
    "visible.",
    ".err:empty { display: none } is the neat part - the message element "
    "is always in the HTML, and it only takes up space when JavaScript "
    "has put text in it. No layout jump."],
  "code": {"lang": "css", "text": css_block("input.invalid",
                                            "\n.two {")},
  "show": "Reload, run showErrors in the console again. Red border, red "
          "message. Same JavaScript as a minute ago - only the stylesheet "
          "changed.",
  "check": "Clear the error and the space collapses. If it does not, the "
           ":empty rule is missing."},

 {"id": "8", "mins": 6, "layer": "js", "todo": "J3 + J4",
  "title": "Two questions the form cannot answer",
  "say": [
    "These are the first functions that need HISTORY, not just the form.",
    "postedToday loops every transaction and adds up today's. This is the "
    "accumulator pattern from Week 7 - start outside the loop, add inside.",
    "recentDuplicate is Week 13's duplicate-submission problem arriving "
    "early. Same payee, same amount, inside a minute: almost certainly one "
    "payment sent twice.",
    "Say plainly: no amount of checking the form could answer either of "
    "these. That is why the data lives in an array."],
  "code": {"lang": "js", "text": js_fn("postedToday") + "\n\n" +
           js_fn("recentDuplicate")},
  "show": "Nothing on screen. Both are console-testable once there are a "
          "few transactions.",
  "check": "postedToday('CHK-4471') is 0 before any payments."},

 {"id": "9", "mins": 8, "layer": "js", "todo": "J5",
  "title": "The business rules - and the order argument",
  "say": [
    "The data is already known to be good. These decide what happens to it.",
    "Read the four branches out loud in order. Then ask the room: a $9,500 "
    "payment from an account holding $4,100, sent twice in ten seconds - "
    "which message should the user see?",
    "There is no single correct answer, but there is a correct method: "
    "pick the one most useful to the person reading it. Put a comment "
    "above the chain saying why you chose that order.",
    "This is the highest-value conversation in the whole demo. Do not "
    "rush it."],
  "code": {"lang": "js", "text": js_fn("applyRules")},
  "show": "Swap the first two branches live, reload, and send $9,500 from "
          "the aid account. The answer changes. Nothing was broken - the "
          "order IS the policy.",
  "check": "Put it back. Every branch returns the same shape: status, "
           "reason, message.",
  "ask": "Which of these four rules could you have written in CSS? None. "
         "Why not?"},

 {"id": "10", "mins": 6, "layer": "js", "todo": "J6",
  "title": "One payment, end to end",
  "say": [
    "Validate, then apply the rules, then write it down. A rejected "
    "request never reaches the rules - look at the early return.",
    "Three statuses, not two. REJECTED means the data was unusable. HELD "
    "means the data was fine and policy stopped it. They are different "
    "things and the user deserves to know which happened.",
    "unshift puts the newest transaction at the front of the array, which "
    "is why the ledger needs no sorting later."],
  "code": {"lang": "js", "text": js_fn("processPayment")},
  "show": "In the console: processPayment({account:'CHK-4471', "
          "payee:'Bursar', amount:'840.25', category:'tuition', "
          "reference:''}). A whole transaction object comes back.",
  "check": "Run it again with amount '9999999' and watch it come back "
           "ok:false with an errors object instead."},

 {"id": "11", "mins": 7, "layer": "js", "todo": "J9 + J10 + J11",
  "title": "Put the answer on the page",
  "say": [
    "Three render functions, and none of them decide anything. They take "
    "data that already exists and turn it into HTML.",
    "renderAccounts is called again after every payment, which is why the "
    "balance on screen is never stale.",
    "In renderLedger, point at the totals loop. That is the same "
    "accumulator from step 8, except now the room can see the number "
    "change."],
  "code": {"lang": "js", "text": js_fn("renderReceipt") + "\n\n" +
           js_fn("renderLedger")},
  "show": "Still nothing until the submit handler exists - these are being "
          "defined, not called.",
  "check": "Call renderLedger() by hand in the console. The empty-state row "
           "appears."},

 {"id": "12", "mins": 3, "layer": "css", "todo": "C8",
  "title": "One pill, three meanings",
  "say": [
    "One shape rule, three colour variants. JavaScript writes the class "
    "name from the status; CSS decides what each one looks like.",
    "This is the clearest example of the split on the whole page. The word "
    "DECLINED is JavaScript's. The fact that it is red is CSS's."],
  "code": {"lang": "css", "text": css_block(".pill {", "\n/* ---- ledger")},
  "show": "Nothing yet - no receipt has been drawn. Next step lights it up.",
  "check": "Three variants, all readable. Make them check the contrast, "
           "not just the vibe."},

 {"id": "13", "mins": 7, "layer": "js", "todo": "J12",
  "title": "Wire it up - and watch the whole thing come alive",
  "say": [
    "preventDefault() is the line that stops the page reloading. Without "
    "it the browser does what it did in 1998 and everything you just "
    "wrote is thrown away.",
    "The blur handler is why the form does not shout at you while you are "
    "still typing. It only complains about a field once you have left it.",
    "The setTimeout is honest theatre - it gives the busy state something "
    "to be busy during. In Week 10 that pause becomes a real request to a "
    "real server, and nothing else in this file changes."],
  "code": {"lang": "js", "text": js_lines(
      "document.addEventListener('DOMContentLoaded'") + "\n" +
      "  // ... the blur and input handlers ...\n\n" +
      re.search(r"  \$\('#payForm'\)\.addEventListener.*?\n  \}\);",
                JS, re.S).group(0)},
  "show": "Fill in the form and press Send payment. Receipt, balance drop, "
          "ledger row, totals. The app is finished.",
  "check": "Try all three outcomes: 840.25 posts, 6200 is held, 9500 from "
           "the aid account is declined."},

 {"id": "14", "mins": 3, "layer": "css", "todo": "C9",
  "title": "Make it survive a phone",
  "say": [
    "Three lines. The HTML does not change and the JavaScript does not "
    "change - only the stylesheet has an opinion about screen width.",
    "Resize the window slowly and let them watch it snap to one column."],
  "code": {"lang": "css", "text": css_block("@media (max-width: 900px)")},
  "show": "Drag the window narrow. Two columns become one.",
  "check": "Open DevTools device mode and try an iPhone SE. Nothing should "
           "overflow sideways."},

 {"id": "15", "mins": 5, "layer": "both", "todo": "S1 + S3",
  "title": "The two stretch pieces worth demoing",
  "say": [
    "Dark mode is eight lines because step 1 was done properly. Redefine "
    "the tokens, change nothing else. If a student hard-coded colours "
    "below :root, this is where it hurts - and that is the lesson.",
    "The layer view is one CSS block plus one line of JavaScript. Show "
    "the toggle, then show how little code it took."],
  "code": {"lang": "css", "text": css_block(
      "@media (prefers-color-scheme: dark)", "\n* {") + "\n\n" +
      "/* and the layer view, in full: */\n" +
      css_block("[data-layer]::before", "\n.foot")},
  "show": "Switch the OS to dark mode, then tick the layer toggle.",
  "check": "If dark mode looks broken, somebody wrote a colour outside the "
           "tokens. Find it together - it takes thirty seconds and the "
           "point lands permanently."},
]

TOTAL = sum(s["mins"] for s in STEPS)
json.dump({"steps": STEPS, "total": TOTAL},
          open(os.path.join(HERE, "steps.json"), "w"), indent=1)
print("%d steps, %d minutes" % (len(STEPS), TOTAL))
for s in STEPS:
    n = len(s["code"]["text"].split("\n")) if s["code"] else 0
    print("  %-3s %-2s min  %-46s %s" %
          (s["id"], s["mins"], s["title"][:46],
           ("%d code lines" % n) if n else "no code"))
