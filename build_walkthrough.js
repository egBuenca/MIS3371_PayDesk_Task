// MIS 3371 - PayDesk demo walkthrough. Steps and code come from
// steps.json, which build_steps.py extracts from the working app.
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  PageBreak, LevelFormat, convertInchesToTwip
} = require("docx");
const fs = require("fs");
const path = require("path");

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, "steps.json")));
const RED="C8102E", INK="15181D", GRAY="6B7280", BLUE="2563EB",
      PURPLE="8B33D6", SOFT="FAEEF1", MIST="F3F4F6", LINE="E3E6EA",
      OK="1F7A45", AMBER="9A6100";
const CW = 9360;

const GB = c => ({
  top:{style:BorderStyle.SINGLE,size:3,color:c||LINE},
  bottom:{style:BorderStyle.SINGLE,size:3,color:c||LINE},
  left:{style:BorderStyle.SINGLE,size:3,color:c||LINE},
  right:{style:BorderStyle.SINGLE,size:3,color:c||LINE}});
const p=(t,o)=>{o=o||{};return new Paragraph({
  spacing:{before:o.before||0,after:o.after===undefined?90:o.after,line:o.line||250},
  children:[new TextRun({text:t,font:"Calibri",size:o.size||20,bold:o.bold,
    italics:o.italics,color:o.color||INK})]});};
const rich=(runs,o)=>{o=o||{};return new Paragraph({
  spacing:{before:o.before||0,after:o.after===undefined?90:o.after,line:250},
  children:runs.map(r=>new TextRun({text:r.t,bold:r.b,italics:r.i,
    color:r.c||INK,font:r.f||"Calibri",size:r.s||20}))});};
const h1=t=>new Paragraph({heading:HeadingLevel.HEADING_1,
  spacing:{before:280,after:120},
  border:{bottom:{style:BorderStyle.SINGLE,size:8,color:RED}},
  children:[new TextRun({text:t,font:"Georgia",size:26,bold:true,color:INK})]});
const bullet=t=>new Paragraph({numbering:{reference:"dot",level:0},
  spacing:{after:70,line:250},
  children:[new TextRun({text:t,font:"Calibri",size:20,color:INK})]});
const cell=(k,o)=>new TableCell({width:{size:o.w,type:WidthType.DXA},
  shading:o.fill?{type:ShadingType.CLEAR,color:"auto",fill:o.fill}:undefined,
  margins:{top:o.tight?50:80,bottom:o.tight?50:80,left:110,right:110},
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

function code(text){
  const lines = text.split("\n");
  return new Table({columnWidths:[CW],width:{size:CW,type:WidthType.DXA},
    borders:GB("10222F"),
    rows:[new TableRow({children:[new TableCell({
      width:{size:CW,type:WidthType.DXA},
      shading:{type:ShadingType.CLEAR,color:"auto",fill:"10222F"},
      margins:{top:120,bottom:120,left:140,right:120},
      children:lines.map(l=>new Paragraph({spacing:{after:0,line:215},
        children:[new TextRun({text:l===""?" ":l,font:"Consolas",size:15,
          color:"DCE7EC"})]}))})]})]});
}

function box(title,lines,accent,fill){
  const kids=[];
  if(title) kids.push(new Paragraph({spacing:{after:55},
    children:[new TextRun({text:title,bold:true,font:"Calibri",size:18,
      color:accent})]}));
  lines.forEach((l,i)=>kids.push(new Paragraph({
    spacing:{after:i===lines.length-1?0:60,line:245},
    children:[new TextRun({text:l,font:"Calibri",size:19,color:INK})]})));
  return new Table({columnWidths:[CW],width:{size:CW,type:WidthType.DXA},
    borders:{top:{style:BorderStyle.SINGLE,size:14,color:accent},
             bottom:{style:BorderStyle.SINGLE,size:3,color:LINE},
             left:{style:BorderStyle.SINGLE,size:3,color:LINE},
             right:{style:BorderStyle.SINGLE,size:3,color:LINE}},
    rows:[new TableRow({children:[cell(kids,{w:CW,fill:fill||"FFFFFF"})]})]});
}
const gap=n=>new Paragraph({spacing:{after:n||110},children:[]});
const brk=()=>new Paragraph({children:[new PageBreak()]});

const LAYER = {css:{t:"CSS",c:BLUE}, js:{t:"JAVASCRIPT",c:PURPLE},
               both:{t:"BOTH",c:RED}};

const body=[];

/* ---------------- cover ---------------- */
body.push(new Paragraph({spacing:{after:40},
  children:[new TextRun({text:"MIS 3371  ·  SECTION 20300  ·  INSTRUCTOR WALKTHROUGH",
    font:"Calibri",size:17,bold:true,color:RED,characterSpacing:30})]}));
body.push(new Paragraph({spacing:{after:60},
  children:[new TextRun({text:"PayDesk, Step by Step",font:"Georgia",
    size:38,bold:true,color:INK})]}));
body.push(new Paragraph({spacing:{after:40},
  border:{bottom:{style:BorderStyle.SINGLE,size:8,color:RED}},
  children:[new TextRun({text:"Sixteen steps for the live demo - what to say, what to type, and what should happen",
    font:"Calibri",size:22,color:GRAY})]}));
body.push(gap(150));

body.push(box("How to run this",[
  "Build the app in front of them in this order. The order is the "
  + "teaching: CSS and JavaScript alternate, so something visible changes "
  + "every few minutes and neither layer gets a boring half-hour.",
  "Every code block below is lifted straight out of the finished app, so "
  + "what you type is known to run. Type it; do not paste it. They are "
  + "copying you, and paste teaches nothing.",
  "Full run is " + DATA.total + " minutes. The cut-down path is on the "
  + "next page if your session is shorter."],RED,SOFT));
body.push(gap(140));

body.push(h1("The running order"));
body.push(table([700,900,4760,1200,1800],
  ["#","Layer","Step","TODO","Minutes"],
  DATA.steps.map(s=>[s.id,
    {t:LAYER[s.layer].t.slice(0,3),b:true,c:LAYER[s.layer].c},
    s.title,s.todo||"-",String(s.mins)])));
body.push(gap(130));

body.push(box("If you only have 50 minutes",[
  "Keep: 0, 1, 2, 4, 5, 6, 7, 9, 10, 13. That is the full loop - tokens, "
  + "layout, the Number('') trap, validation, the error round trip, the "
  + "rules argument, and the submit handler that makes it live.",
  "Cut: 3, 8, 11, 12, 14, 15. Tell them you are cutting them and that the "
  + "code is in the reference folder. Naming the cut is the difference "
  + "between pacing and running out of time.",
  "Never cut step 9. The argument about branch order is the one thing "
  + "here they cannot get from a tutorial."],AMBER,"FCF4E6"));
body.push(gap(120));

body.push(box("Three things to set up before you start",[
  "1. Two windows side by side: VS Code with the starter, and a browser "
  + "on starter/index.html. Not a projector showing one at a time.",
  "2. The browser console open (F12) and left open all session. You will "
  + "use it in steps 4, 5, 6, 10 and 11.",
  "3. The finished app in a second browser tab, so you can flip to it when "
  + "somebody asks what it is supposed to look like."],BLUE,MIST));

body.push(brk());

/* ---------------- the steps ---------------- */
DATA.steps.forEach((s,i)=>{
  const L = LAYER[s.layer];

  body.push(new Table({columnWidths:[760, CW-760],
    width:{size:CW,type:WidthType.DXA},
    borders:{top:{style:BorderStyle.SINGLE,size:14,color:L.c},
             bottom:{style:BorderStyle.SINGLE,size:3,color:LINE},
             left:{style:BorderStyle.SINGLE,size:3,color:LINE},
             right:{style:BorderStyle.SINGLE,size:3,color:LINE}},
    rows:[new TableRow({cantSplit:true,children:[
      cell(new Paragraph({spacing:{after:0},alignment:"center",
        children:[new TextRun({text:s.id,font:"Georgia",size:30,bold:true,
          color:L.c})]}),{w:760,fill:MIST}),
      cell([
        new Paragraph({spacing:{after:30},children:[
          new TextRun({text:s.title,font:"Georgia",size:23,bold:true,
            color:INK})]}),
        new Paragraph({spacing:{after:0},children:[
          new TextRun({text:L.t,font:"Calibri",size:16,bold:true,color:L.c,
            characterSpacing:20}),
          new TextRun({text:"   ·   "+(s.todo?s.todo+"   ·   ":"")+
            s.mins+" minutes",font:"Calibri",size:17,color:GRAY})
        ]})
      ],{w:CW-760})
    ]})]}));
  body.push(gap(90));

  body.push(rich([{t:"SAY",b:true,c:RED,s:17}],{after:50}));
  s.say.forEach(line=>body.push(bullet(line)));

  if (s.code) {
    body.push(rich([{t:"TYPE",b:true,c:RED,s:17},
      {t:"   "+(s.code.lang==="css"?"style.css":"app.js"),c:GRAY,s:17,
       f:"Consolas"}],{before:80,after:50}));
    body.push(code(s.code.text));
  }

  body.push(rich([{t:"SHOW   ",b:true,c:OK,s:17},{t:s.show}],
    {before:90,after:60}));
  body.push(rich([{t:"CHECK   ",b:true,c:GRAY,s:17},{t:s.check,c:GRAY,s:19}],
    {after:s.ask?60:0}));
  if (s.ask) {
    body.push(rich([{t:"ASK THE ROOM   ",b:true,c:PURPLE,s:17},
      {t:s.ask,i:true}],{after:0}));
  }

  if (i !== DATA.steps.length-1) { body.push(brk()); }
});

/* ---------------- appendix ---------------- */
body.push(brk());
body.push(h1("Appendix - the numbers to demo with"));
body.push(p("Keep these on a sticky note. They hit every branch of the "
  +"rules in order.",{after:130}));
body.push(table([1900,2100,2300,3060],
  ["Amount","From","Outcome","What it proves"],[
  ["840.25","Checking","POSTED","The happy path, and the balance drops"],
  ["0  /  -40  /  twelve","any","Rejected at validation","Three different messages, no rules ran"],
  ["6200","Checking","HELD","Valid data, policy stopped it"],
  ["9500","Financial Aid","DECLINED","Over the balance"],
  ["840.25 twice, fast","Checking","HELD","Duplicate inside 60 seconds"],
  ["10500","any","Rejected at validation","Over the per-payment cap"]]));
body.push(gap(140));

body.push(h1("Appendix - questions they will ask"));
const QA = [
 ["Why not just use the browser's built-in validation (required, min, "
  +"type=number)?",
  "Use it as well - it is free. But it cannot express 'over the daily "
  +"limit' or 'duplicate of something sent a minute ago', and its "
  +"messages cannot be styled to match the app. We turned it off with "
  +"novalidate so the lesson is visible."],
 ["Could the rules go in the CSS?",
  "No, and it is worth answering seriously. CSS can react to states a "
  +"browser already knows (:invalid, :empty), but it cannot add numbers, "
  +"look at history, or decide anything. The moment you need an if, you "
  +"are in JavaScript."],
 ["Why does the data vanish when I reload?",
  "Because it only lives in a JavaScript array. That is honest for this "
  +"week. Persistence is Week 12, and the fix is a server, not a cleverer "
  +"array."],
 ["Is this secure? Can't I just edit the JavaScript and pay myself?",
  "Yes, and you should say so plainly. Everything here is for usability. "
  +"A real system re-checks every rule on the server, because anything "
  +"in the browser belongs to the user. That is Week 11."],
 ["Can I use a framework / library for this?",
  "Not for this task. The point is seeing the DOM calls and the decisions "
  +"with nothing in between. You will meet the abstraction later and it "
  +"will make more sense for having done it by hand once."],
];
QA.forEach(q=>{
  body.push(rich([{t:q[0],b:true}],{before:120,after:40}));
  body.push(p(q[1],{after:0}));
});

body.push(gap(150));
body.push(box("The sentence to repeat until they say it back",[
  "CSS decides what it looks like. JavaScript decides what is true.",
  "Everything in this demo is a worked example of that one line - and it "
  + "is also the thing the code defence will test, because a student who "
  + "cannot say which file a decision belongs in did not write the file."
],RED,SOFT));

const doc=new Document({
  creator:"MIS 3371",title:"MIS 3371 - PayDesk demo walkthrough",
  description:"Step by step instructor script for the PayDesk build",
  numbering:{config:[{reference:"dot",levels:[
    {level:0,format:LevelFormat.BULLET,text:"▪",alignment:"left",
     style:{paragraph:{indent:{left:convertInchesToTwip(0.3),
       hanging:convertInchesToTwip(0.18)}}}}]}]},
  styles:{default:{heading1:{run:{font:"Georgia",size:26,bold:true,color:INK}}}},
  sections:[{properties:{page:{margin:{top:1000,right:1000,bottom:1000,left:1000}}},
    children:body}]});
Packer.toBuffer(doc).then(b=>{
  fs.writeFileSync(path.join(__dirname,"task","MIS3371_PayDesk_Demo_Walkthrough.docx"),b);
  console.log("walkthrough -> "+(b.length/1024).toFixed(0)+" KB");});
