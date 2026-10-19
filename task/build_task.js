// MIS 3371 - Task brief: build the PayDesk transaction app.
// Screenshots are of the reference app, captured by shots.js in a real
// browser - so what the brief shows is what the code actually does.
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  PageBreak, LevelFormat, convertInchesToTwip, AlignmentType
} = require("docx");
const fs = require("fs");
const path = require("path");

const RED="C8102E", INK="15181D", GRAY="6B7280", BLUE="2563EB",
      PURPLE="8B33D6", SOFT="FAEEF1", MIST="F3F4F6", LINE="E3E6EA",
      OK="1F7A45";
const CW = 9360;
const IMG = p => fs.readFileSync(path.join(__dirname, "img", p));

const GB = c => ({
  top:{style:BorderStyle.SINGLE,size:3,color:c||LINE},
  bottom:{style:BorderStyle.SINGLE,size:3,color:c||LINE},
  left:{style:BorderStyle.SINGLE,size:3,color:c||LINE},
  right:{style:BorderStyle.SINGLE,size:3,color:c||LINE}});

const p=(t,o)=>{o=o||{};return new Paragraph({
  spacing:{before:o.before||0,after:o.after===undefined?100:o.after,line:o.line||255},
  alignment:o.align,
  children:[new TextRun({text:t,font:"Calibri",size:o.size||20,bold:o.bold,
    italics:o.italics,color:o.color||INK})]});};
const h1=t=>new Paragraph({heading:HeadingLevel.HEADING_1,
  spacing:{before:300,after:130},
  border:{bottom:{style:BorderStyle.SINGLE,size:8,color:RED}},
  children:[new TextRun({text:t,font:"Georgia",size:26,bold:true,color:INK})]});
const h2=t=>new Paragraph({heading:HeadingLevel.HEADING_2,
  spacing:{before:230,after:85},
  children:[new TextRun({text:t,font:"Georgia",size:22,bold:true,color:RED})]});
const bullet=(t,o)=>{o=o||{};return new Paragraph({
  numbering:{reference:"dot",level:0},spacing:{after:70,line:250},
  children:[new TextRun({text:t,font:"Calibri",size:20,color:o.color||INK,
    bold:o.bold})]});};
const cell=(k,o)=>new TableCell({width:{size:o.w,type:WidthType.DXA},
  shading:o.fill?{type:ShadingType.CLEAR,color:"auto",fill:o.fill}:undefined,
  margins:{top:80,bottom:80,left:110,right:110},
  children:Array.isArray(k)?k:[k]});
function table(cols,headers,rows){
  const trs=[];
  if(headers) trs.push(new TableRow({tableHeader:true,cantSplit:true,
    children:headers.map((h,i)=>cell(new Paragraph({spacing:{after:0},
      children:[new TextRun({text:h,bold:true,color:"FFFFFF",font:"Calibri",
        size:19})]}),{w:cols[i],fill:INK}))}));
  rows.forEach((r,ri)=>trs.push(new TableRow({cantSplit:true,
    children:r.map((c,i)=>{const o=typeof c==="object";
      return cell(new Paragraph({spacing:{after:0},
        children:[new TextRun({text:o?c.t:c,font:(o&&c.f)||"Calibri",
          size:(o&&c.s)||19,bold:o&&c.b,color:(o&&c.c)||INK})]}),
        {w:cols[i],fill:(o&&c.fill)||(ri%2?MIST:"FFFFFF")});})})));
  return new Table({columnWidths:cols,
    width:{size:cols.reduce((a,b)=>a+b,0),type:WidthType.DXA},
    borders:GB(),rows:trs});
}
function box(title,lines,accent,fill){
  const kids=[];
  if(title) kids.push(new Paragraph({spacing:{after:60},
    children:[new TextRun({text:title,bold:true,font:"Calibri",size:19,
      color:accent})]}));
  lines.forEach((l,i)=>kids.push(new Paragraph({
    spacing:{after:i===lines.length-1?0:70,line:250},
    children:[new TextRun({text:l,font:"Calibri",size:19,color:INK})]})));
  return new Table({columnWidths:[CW],width:{size:CW,type:WidthType.DXA},
    borders:{top:{style:BorderStyle.SINGLE,size:18,color:accent},
             bottom:{style:BorderStyle.SINGLE,size:3,color:LINE},
             left:{style:BorderStyle.SINGLE,size:3,color:LINE},
             right:{style:BorderStyle.SINGLE,size:3,color:LINE}},
    rows:[new TableRow({children:[cell(kids,{w:CW,fill:fill||"FFFFFF"})]})]});
}
function shot(file,w,h,caption){
  return [
    new Paragraph({spacing:{before:60,after:40},alignment:AlignmentType.CENTER,
      children:[new ImageRun({data:IMG(file),
        transformation:{width:w,height:h}})]}),
    new Paragraph({spacing:{after:170},alignment:AlignmentType.CENTER,
      children:[new TextRun({text:caption,font:"Calibri",size:17,
        italics:true,color:GRAY})]})];
}
const gap=n=>new Paragraph({spacing:{after:n||120},children:[]});
const brk=()=>new Paragraph({children:[new PageBreak()]});

const body=[];

/* ---------------- cover ---------------- */
body.push(new Paragraph({spacing:{after:40},
  children:[new TextRun({text:"MIS 3371  ·  TRANSACTION PROCESSING SYSTEMS I  ·  SECTION 20300",
    font:"Calibri",size:17,bold:true,color:RED,characterSpacing:30})]}));
body.push(new Paragraph({spacing:{after:60},
  children:[new TextRun({text:"Task: Build PayDesk",font:"Georgia",size:38,
    bold:true,color:INK})]}));
body.push(new Paragraph({spacing:{after:40},
  border:{bottom:{style:BorderStyle.SINGLE,size:8,color:RED}},
  children:[new TextRun({text:"A modern transaction web app, built in two layers - CSS for how it looks, JavaScript for what it does",
    font:"Calibri",size:22,color:GRAY})]}));
body.push(gap(150));

body.push(box("What you are building",[
  "A single-page payment desk. Someone picks an account, types who they "
  +"are paying and how much, and the app decides on the spot whether the "
  +"payment posts, gets held, or is declined - then shows a receipt and "
  +"adds it to a running ledger.",
  "There is no page reload anywhere in it, and no server. Three files: "
  +"index.html for the structure (given to you), style.css for the look, "
  +"app.js for the behaviour and the decisions.",
  "The whole point of the task is the line between those last two files. "
  +"If you ever write an if statement in the CSS, or a colour in the "
  +"JavaScript, you have crossed it."
],RED,SOFT));
body.push(gap(140));

body.push(h1("The two layers, and what belongs in each"));
body.push(table([2200,3600,3560],["","CSS does","JavaScript does"],[
  ["Fields","Size, spacing, border, focus ring","Reads the values out of them"],
  ["Errors","What \"wrong\" looks like - red border, red text",
   "Decides WHICH fields are wrong, and writes the message"],
  ["Status","What POSTED, HELD and DECLINED look like",
   "Decides which one this payment is"],
  ["The button","Its colour, and what the busy state looks like",
   "Disables it, and runs the payment when it is clicked"],
  ["The ledger","Table layout, alignment, row lines",
   "Builds the rows from the transactions array"],
  ["Small screens","Collapses to one column","Nothing - this is CSS's job alone"],
  ["The totals","How the three tiles are laid out",
   "Loops the array and counts them"]
]));
body.push(gap(120));
body.push(box("The test for which file something belongs in",[
  "Could a blind user with a screen reader still get the right answer "
  +"with your CSS switched off? If not, a decision has leaked into the "
  +"CSS layer.",
  "Does a function in app.js mention a colour, a pixel, or a font? Then "
  +"a presentation detail has leaked into the JavaScript layer.",
  "Both leaks cost marks, and both are easy to avoid if you check as you "
  +"go rather than at the end."
],BLUE,MIST));
body.push(brk());

/* ---------------- the final output ---------------- */
body.push(h1("What the finished app looks like"));
body.push(p("These are screenshots of the working reference version. Yours "
  +"does not have to match pixel for pixel - the colours and the spacing "
  +"are your decisions - but every state shown here has to work.",{after:150}));

body.push(h2("1. The starting state"));
body.push(...shot("01_empty.png",620,490,
  "An empty form, an empty ledger, and three accounts with their balances. "
  +"Nothing has been decided yet."));

body.push(h2("2. The JavaScript layer catching bad input"));
body.push(...shot("02_validation.png",620,490,
  "Three fields are wrong, each with its own message. The red borders are "
  +"CSS; knowing which fields to put them on is JavaScript."));
body.push(brk());

body.push(h2("3. A payment that posts"));
body.push(...shot("03_posted.png",620,490,
  "$840.25 to the Bursar's Office. A receipt appears, the balance drops "
  +"from $8,420.55 to $7,580.30, and the ledger gains a row."));

body.push(h2("4. A payment that policy holds"));
body.push(...shot("04_held.png",620,490,
  "$6,200 is over the review threshold, so it is HELD rather than refused. "
  +"Held is not an error - telling the two apart is the point."));
body.push(brk());

body.push(h2("5. A payment that is declined"));
body.push(...shot("05_declined.png",620,490,
  "$9,500 from an account holding $4,100. The data was perfectly valid; "
  +"policy is what stopped it."));

body.push(h2("6. The layer view"));
body.push(...shot("06_layers.png",620,490,
  "The toggle in the header outlines every region and names the layer "
  +"responsible for it. Build this and you will not get the two mixed up."));
body.push(brk());

/* ---------------- requirements ---------------- */
body.push(h1("What to build"));
body.push(p("The starter has every one of these marked as a TODO in the file "
  +"it belongs in. Work down the list; the app comes alive in pieces.",
  {after:140}));

body.push(h2("The CSS layer - style.css"));
body.push(table([900,8460],["#","What to write"],[
  ["C1","Design tokens on :root - background, surface, text, muted text, border, brand, radius"],
  ["C2","Page basics: margin, background, colour, font family, line-height, box-sizing"],
  ["C3","The .wrap container - max width, centred, side padding"],
  ["C4","The two-column layout with CSS grid"],
  ["C5","The .card surface - background, border, radius, shadow, padding"],
  ["C6","Form controls - full width, padding, radius, font: inherit, and a visible focus ring"],
  ["C7","The state classes JavaScript sets: input.invalid, input.valid, and .err"],
  ["C8","Buttons, and the three status pills: posted, held, declined"],
  ["C9","Responsive - one column under 900px"]
]));
body.push(gap(130));

body.push(h2("The JavaScript layer - app.js"));
body.push(table([900,8460],["#","What to write"],[
  ["J1","toAmount(text) - text to number, NaN when empty"],
  ["J2","validate(form) - returns {} or { field: message }"],
  ["J3","postedToday(code) - total posted from this account since midnight"],
  ["J4","recentDuplicate(code, payee, amount) - same payment inside a minute"],
  ["J5","applyRules(form) - returns { status, reason, message }"],
  ["J6","processPayment(form) - validate, apply rules, record, update the balance"],
  ["J7","readForm() - the five field values as one object"],
  ["J8","showErrors(errors) - set the messages and the class names"],
  ["J9","renderAccounts() - fill the account list with live balances"],
  ["J10","renderReceipt(txn) - write the decision into the page"],
  ["J11","renderLedger() - the table rows and the three totals"],
  ["J12","Wire up the events: blur, input, and submit"]
]));
body.push(gap(130));

body.push(h2("The rules your app must enforce"));
body.push(table([2600,3100,3660],["Rule","Outcome","Why it cannot be a CSS rule"],[
  ["Amount is empty, zero, negative, or not a number","Rejected before anything else",
   "It is a question about a value, not about appearance"],
  ["Payee missing, or over 40 characters","Rejected","Same"],
  ["Amount over $10,000","Rejected","A limit is a number comparison"],
  ["Amount over the account balance","DECLINED","Needs the balance, which only the data knows"],
  ["Account is over $25,000 for the day","DECLINED","Needs every earlier payment today"],
  ["Same payee and amount inside 60 seconds","HELD","Needs to look at history"],
  ["Amount of $5,000 or more","HELD for review","A threshold, decided in code"],
  ["Everything else","POSTED",""]
]));
body.push(gap(120));
body.push(box("Order matters, and you will be asked about it",[
  "A $9,500 payment from an account with $4,100, submitted twice in ten "
  +"seconds, trips three rules at once. Which message should the user see?",
  "There is no single right answer, but there is a right way to decide: "
  +"pick the one that is most useful to the person reading it, and write "
  +"one sentence in a comment saying why you put that branch first."
],PURPLE,MIST));
body.push(brk());

/* ---------------- stretch ---------------- */
body.push(h1("If you finish early"));
body.push(table([2400,6960],["","What to add"],[
  ["S1  Dark mode","Redefine the tokens inside @media (prefers-color-scheme: dark). If you built C1 properly this is about eight lines and nothing else changes."],
  ["S2  Pending state","Show a spinner on the button for a moment before the receipt appears, so the app feels like it is working."],
  ["S3  Layer view","The toggle from screenshot 6: outline every [data-layer] element and show its note. Pure CSS plus one class name from JavaScript."],
  ["S4  Touched fields","Only complain about a field after the user has left it once. Much less annoying to use, and only a few lines."],
  ["S5  Filter the ledger","A row of buttons that shows only posted, only held, or all - without reloading or losing data."],
  ["S6  Keyboard only","Do a whole payment without touching the mouse. Fix whatever you cannot reach."]
]));
body.push(gap(110));
body.push(...shot("07_dark_mobile.png",300,978,
  "S1 and the responsive layout together: same HTML, same JavaScript, "
  +"different tokens and one media query."));

/* ---------------- grading ---------------- */
body.push(brk());
body.push(h1("How it is marked"));
body.push(table([5400,1500,2460],["","Points","Notes"],[
  ["The app runs with no console errors","10","Open the console before you submit"],
  ["CSS layer C1-C9 complete","25","Readable, token-driven, no magic colours repeated everywhere"],
  ["JavaScript layer J1-J12 complete","35","Correct outcomes for every rule in the table"],
  ["The two layers stay separate","15","No decisions in CSS, no styling in JavaScript"],
  ["Responsive and usable by keyboard","10","Narrow the window; tab through the form"],
  ["Comments that say why, not what","5","Especially on the order of your rules"],
  [{t:"Total",b:true},{t:"100",b:true},""]
]));
body.push(gap(130));

body.push(h2("What to hand in"));
body.push(bullet("The three files, in a folder, in your repository."));
body.push(bullet("Screenshots of your own app in all four states: empty, "
  +"a validation error, a posted payment, and a declined one."));
body.push(bullet("Two or three sentences on the order of your rules in J5 - "
  +"which check you put first and why."));
body.push(bullet("A commit message that says what you did, not \"update\"."));
body.push(gap(110));

body.push(box("Be ready to explain any line of it",[
  "The syllabus says code you cannot explain may receive no credit, and "
  +"the individual code defence is worth 10% of the course.",
  "Pick any function in app.js. Be able to say out loud what goes in, "
  +"what comes out, and why the lines are in that order. If a tool wrote "
  +"a line you cannot explain, delete it and write one you can."
],RED,SOFT));

const doc=new Document({
  creator:"MIS 3371",title:"MIS 3371 - Task: Build PayDesk",
  description:"Build a modern transaction web app, split into a CSS layer and a JavaScript layer",
  numbering:{config:[{reference:"dot",levels:[
    {level:0,format:LevelFormat.BULLET,text:"▪",alignment:"left",
     style:{paragraph:{indent:{left:convertInchesToTwip(0.3),
       hanging:convertInchesToTwip(0.18)}}}}]}]},
  styles:{default:{
    heading1:{run:{font:"Georgia",size:26,bold:true,color:INK}},
    heading2:{run:{font:"Georgia",size:22,bold:true,color:RED}}}},
  sections:[{properties:{page:{margin:{top:1080,right:1080,bottom:1080,left:1080}}},
    children:body}]});
Packer.toBuffer(doc).then(b=>{
  fs.writeFileSync(path.join(__dirname,"MIS3371_Task_Build_PayDesk.docx"),b);
  console.log("task -> MIS3371_Task_Build_PayDesk.docx ("+b.length+" bytes)");});
