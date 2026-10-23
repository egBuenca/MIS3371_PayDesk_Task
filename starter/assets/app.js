/* ===================================================================
   PayDesk - app.js  (STARTER)

   The JavaScript layer is yours. Keep the three sections apart:

     1. DATA     - plain objects and arrays
     2. DECIDING - validation and business rules, NO document.* here
     3. SHOWING  - read the form, write to the page

   Section 2 is the part a grader will ask you to explain. If a
   function in it mentions the page, it is in the wrong section.
   =================================================================== */

/* =========================== 1. DATA =========================== */

const POLICY = {
  maxPerPayment: 10000,
  maxPerDay: 25000,
  reviewAtOrAbove: 5000,
  duplicateWindowMs: 60 * 1000,
  maxPayeeLength: 40,
  maxReferenceLength: 60
};

const CATEGORIES = ['tuition', 'housing', 'books', 'meal-plan', 'other'];

const accounts = [
  { code: 'CHK-4471', label: 'Student Checking .. 4471', balance: 8420.55 },
  { code: 'SAV-9920', label: 'Savings .. 9920',          balance: 21350.00 },
  { code: 'AID-1002', label: 'Financial Aid .. 1002',    balance: 4100.00 }
];

const transactions = [];
let counter = 0;

const findAccount = (code) => accounts.find((a) => a.code === code);
const money = (n) => '$' + Number(n).toFixed(2);

/* ======================== 2. DECIDING ========================== */

/* ---- TODO J1 ------------------------------------------------------
   toAmount(text) - turn the typed text into a number, or NaN when the
   box is empty. Remember Number('') is 0, which is not what you want.
   ------------------------------------------------------------------ */
function toAmount(text) {
  if (text.trim() === '' || typeof text !== 'string'){
    return NaN;
  }
  else {
    return Number(text);
  }
}

/* ---- TODO J2 ------------------------------------------------------
   validate(form) - return {} when everything is fine, otherwise
   { fieldName: 'message' }. Check, at least:
     account    must be one of the accounts
     payee      required, 2 to POLICY.maxPayeeLength characters
     amount     present, a number, greater than 0, at most 2 decimals,
                not above POLICY.maxPerPayment
     category   must be one of CATEGORIES
     reference  at most POLICY.maxReferenceLength characters
   ------------------------------------------------------------------ */
function validate(form) {
  const errors = {};

  if (!findAccount(form.account)) {
    errors.account = 'Choose an account to pay from.';
  }

  const payee = form.payee.trim();
  if (payee === '') {
    errors.payee = 'Payee is required.';
  } else if (payee.length < 2) {
    errors.payee = 'Payee must be at least 2 characters.';
  } else if (payee.length > POLICY.maxPayeeLength) {
    errors.payee = 'Payee must be ' + POLICY.maxPayeeLength +
                   ' characters or fewer.';
  }

  const amount = toAmount(form.amount);
  if (form.amount.trim() === '') {
    errors.amount = 'Enter an amount.';
  } else if (Number.isNaN(amount)) {
    errors.amount = 'Amount must be a number.';
  } else if (amount <= 0) {
    errors.amount = 'Amount must be greater than 0.';
  } else if (Math.round(amount * 100) !== amount * 100) {
    errors.amount = 'Amount can have at most 2 decimals.';
  } else if (amount > POLICY.maxPerPayment) {
    errors.amount = 'Single payments are capped at ' +
                    money(POLICY.maxPerPayment) + '.';
  }

  if (!CATEGORIES.includes(form.category)) {
    errors.category = 'Choose a category.';
  }

  if (form.reference.length > POLICY.maxReferenceLength) {
    errors.reference = 'Reference must be ' + POLICY.maxReferenceLength +
                       ' characters or fewer.';
  }

  return errors;
}

/* ---- TODO J3 ------------------------------------------------------
   postedToday(code) - total of POSTED payments from this account
   since midnight. Loop the transactions array and accumulate.
   ------------------------------------------------------------------ */

function postedToday(code) {
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  let total = 0;
  for (const t of transactions) {
    if (t.account === code && t.status === 'POSTED' &&
        t.created >= midnight.getTime()) {
      total = total + t.amount;
    }
  }
  return total;
}

/* ---- TODO J4 ------------------------------------------------------
   recentDuplicate(code, payee, amount) - return the matching
   transaction if the same account, payee and amount went through
   inside POLICY.duplicateWindowMs, otherwise null.
   ------------------------------------------------------------------ */

function recentDuplicate(code, payee, amount) {
  const cutoff = Date.now() - POLICY.duplicateWindowMs;
  for (const t of transactions) {
    if (t.account === code && t.payee === payee &&
        t.amount === amount && t.created >= cutoff) {
      return t;
    }
  }
  return null;
}

/* ---- TODO J5 ------------------------------------------------------
   applyRules(form) - the data is already good. Return
   { status, reason, message } where status is one of:
     DECLINED   over the balance, or over the daily limit
     HELD       a possible duplicate, or at/above the review amount
     POSTED     everything else

   ORDER MATTERS. Decide which check comes first and be ready to say
   why - that is the question you will be asked about this file.
   ------------------------------------------------------------------ */

function applyRules(form) {
  const account = findAccount(form.account);
  const amount = toAmount(form.amount);
  const payee = form.payee.trim();

  if (amount > account.balance) {
    return { status: 'DECLINED', reason: 'INSUFFICIENT_FUNDS',
             message: 'Balance is ' + money(account.balance) +
                      '. This payment is ' + money(amount) + '.' };
  }

  const spent = postedToday(account.code);
  if (spent + amount > POLICY.maxPerDay) {
    return { status: 'DECLINED', reason: 'DAILY_LIMIT',
             message: 'The daily limit is ' + money(POLICY.maxPerDay) +
                      '. ' + money(POLICY.maxPerDay - spent) + ' left today.' };
  }

  if (recentDuplicate(account.code, payee, amount)) {
    return { status: 'HELD', reason: 'POSSIBLE_DUPLICATE',
             message: 'The same payee and amount went through less than a ' +
                      'minute ago. Held for review.' };
  }

  if (amount >= POLICY.reviewAtOrAbove) {
    return { status: 'HELD', reason: 'REVIEW_REQUIRED',
             message: 'Payments of ' + money(POLICY.reviewAtOrAbove) +
                      ' or more are reviewed before release.' };
  }

  return { status: 'POSTED', reason: 'OK',
           message: 'Payment posted to the account.' };
}

/* ---- TODO J6 ------------------------------------------------------
   processPayment(form) - validate, then apply the rules, then record
   the transaction and update the balance when it POSTED.
   Return { ok: false, errors } or { ok: true, transaction }.
   Give every transaction an id like TXN-2026-0001.
   ------------------------------------------------------------------ */
function processPayment(form) {
  const errors = validate(form);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors: errors };
  }

  const decision = applyRules(form);
  const account = findAccount(form.account);
  const amount = toAmount(form.amount);

  counter = counter + 1;
  const txn = {
    id: 'TXN-' + new Date().getFullYear() + '-' +
        String(counter).padStart(4, '0'),
    created: Date.now(),
    account: account.code,
    payee: form.payee.trim(),
    amount: amount,
    category: form.category,
    reference: form.reference.trim(),
    status: decision.status,
    reason: decision.reason,
    message: decision.message
  };

  transactions.unshift(txn);
  if (txn.status === 'POSTED') {
    account.balance = Math.round((account.balance - amount) * 100) / 100;
  }

  return { ok: true, transaction: txn };
}

/* ======================== 3. SHOWING =========================== */

const $ = (sel) => document.querySelector(sel);
const FIELDS = ['account', 'payee', 'amount', 'category', 'reference'];

/* ---- TODO J7 ------------------------------------------------------
   readForm() - return an object with the five field values in it.
   ------------------------------------------------------------------ */
function readForm() {
  return {
    account:   $('#account').value,
    payee:     $('#payee').value,
    amount:    $('#amount').value,
    category:  $('#category').value,
    reference: $('#reference').value
  };
}

/* ---- TODO J8 ------------------------------------------------------
   showErrors(errors) - for each field, write the message into its
   .err element and add or remove the invalid / valid classes. Do not
   style anything here; just set class names and text.
   ------------------------------------------------------------------ */
function showErrors(errors, touchedOnly) {
  for (const name of FIELDS) {
    const input = $('#' + name);
    const slot = document.querySelector('.err[data-for="' + name + '"]');
    const message = errors[name];
    const show = message && (!touchedOnly || input.dataset.touched === 'yes');

    slot.textContent = show ? message : '';
    input.classList.toggle('invalid', Boolean(show));
    input.classList.toggle('valid',
      !message && input.value.trim() !== '' && name !== 'reference');
  }
}

/* ---- TODO J9 ------------------------------------------------------
   renderAccounts() - fill the account select from the accounts array,
   showing each balance. Call it again after a payment posts so the
   balance on screen is never stale.
   ------------------------------------------------------------------ */

function renderAccounts() {
  const select = $('#account');
  const keep = select.value;
  select.innerHTML = accounts.map((a) =>
    '<option value="' + a.code + '">' + a.label + ' &mdash; ' +
    money(a.balance) + '</option>').join('');
  select.value = keep || accounts[0].code;
}

/* ---- TODO J10 -----------------------------------------------------
   renderReceipt(txn) - write the decision into #result: the status
   pill, the message, and the details of the payment.
   ------------------------------------------------------------------ */

function row(label, value) {
  return '<div class="row"><span>' + label + '</span><span>' +
         value + '</span></div>';
}

function renderReceipt(txn) {
  const cls = txn.status.toLowerCase();
  $('#result').innerHTML =
    '<div class="receipt">' +
      '<h2>Receipt</h2>' +
      '<div class="verdict"><span class="pill ' + cls + '">' +
        txn.status + '</span></div>' +
      '<p>' + txn.message + '</p>' +
      '<div class="rows">' +
        row('Reference', '<span class="mono">' + txn.id + '</span>') +
        row('Paid to', txn.payee) +
        row('Amount', '<span class="mono">' + money(txn.amount) + '</span>') +
        row('From', txn.account) +
        row('Category', txn.category) +
        (txn.reference ? row('Note', txn.reference) : '') +
        row('Time', new Date(txn.created).toLocaleTimeString()) +
      '</div>' +
    '</div>';
}

/* ---- TODO J11 -----------------------------------------------------
   renderLedger() - fill #ledger with the most recent transactions,
   and fill #totals with how many were submitted, how many posted, and
   the total paid out. The totals are an accumulator loop.
   ------------------------------------------------------------------ */

function tile(value, label) {
  return '<div class="tile"><b>' + value + '</b><span>' + label +
         '</span></div>';
}

function renderLedger() {
  const body = $('#ledger');

  if (transactions.length === 0) {
    body.innerHTML = '<tr><td colspan="4" class="muted">' +
                     'No payments yet.</td></tr>';
  } else {
    let html = '';
    for (const t of transactions.slice(0, 8)) {
      html += '<tr>' +
        '<td class="mono">' + t.id + '</td>' +
        '<td>' + t.payee + '</td>' +
        '<td class="r mono">' + money(t.amount) + '</td>' +
        '<td><span class="pill ' + t.status.toLowerCase() + '">' +
            t.status + '</span></td></tr>';
    }
    body.innerHTML = html;
  }

  /* the accumulator pattern from Week 7, on screen */
  let posted = 0, held = 0, total = 0;
  for (const t of transactions) {
    if (t.status === 'POSTED') { posted++; total = total + t.amount; }
    else if (t.status === 'HELD') { held++; }
  }
  $('#totals').innerHTML =
    tile(transactions.length, 'submitted') +
    tile(posted, 'posted') +
    tile(money(total), 'paid out');
  void held;
}

/* ======================== WIRING IT UP ========================= */

document.addEventListener('DOMContentLoaded', function () {
  renderAccounts();
  renderLedger();

  /* ---- TODO J12 ---------------------------------------------------
     Wire up the events:
       - on blur of each field, validate and show that field's error
       - on input, update the note counter (#refCount)
       - on submit, preventDefault(), validate everything, and either
         show the errors or process the payment and render the result
     ---------------------------------------------------------------- */

 $('#payForm').addEventListener('submit', function (event) {
  event.preventDefault();

  for (const name of FIELDS) { $('#' + name).dataset.touched = 'yes'; }

  const form = readForm();
  const errors = validate(form);
  showErrors(errors, false);

  if (Object.keys(errors).length > 0) {
    $('#result').innerHTML =
    '<h2>Receipt</h2><p class="muted">Nothing was sent. ' +
    Object.keys(errors).length +
    ' field(s) need fixing first.</p>';
    $('#' + Object.keys(errors)[0]).focus();
    return;
  }

  const button = $('#submitBtn');
  button.classList.add('busy');
  button.disabled = true;

  window.setTimeout(function () {
    const result = processPayment(form);
    button.classList.remove('busy');
    button.disabled = false;

    renderReceipt(result.transaction);
    renderAccounts();
    renderLedger();

    if (result.transaction.status === 'POSTED') {
      $('#payForm').reset();
      $('#refCount').textContent = '0';
      for (const name of FIELDS) {
      $('#' + name).dataset.touched = '';
      $('#' + name).classList.remove('valid', 'invalid');
      }
      renderAccounts();
    }
  }, 450);
});


  /* ---- STRETCH ----------------------------------------------------
     S4  Only complain about a field after the user has left it once.
     S5  Show the pending state on the button for ~400ms before the
         result appears, so the app feels like it is doing something.
     S6  Wire #layerToggle to add and remove .show-layers on <body>.
     ---------------------------------------------------------------- */
});
