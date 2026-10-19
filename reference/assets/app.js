/* ===================================================================
   PayDesk - app.js
   THE JAVASCRIPT LAYER: everything the page DOES.

   Three jobs, kept apart on purpose:

     1. DATA     - the accounts and the transactions, as plain objects
     2. DECIDING - validation and business rules. No DOM in here.
     3. SHOWING  - reading the form and writing to the page.

   Section 2 is the part you could lift out of this file unchanged and
   run anywhere. That is the test of whether you split it properly.
   =================================================================== */

/* =========================== 1. DATA =========================== */

const POLICY = {
  maxPerPayment: 10000,
  maxPerDay:     25000,
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

/* Every payment ever made in this session. An array of objects - the
   same shape you met in Week 6, and the thing the ledger loops over. */
const transactions = [];
let counter = 0;

const findAccount = (code) => accounts.find((a) => a.code === code);
const money = (n) => '$' + Number(n).toFixed(2);

/* ======================== 2. DECIDING ==========================
   Nothing below touches the page. These take values and return
   values, which is what makes them easy to test and easy to explain.
   =============================================================== */

function toAmount(text) {
  if (typeof text !== 'string' || text.trim() === '') { return NaN; }
  return Number(text);
}

/* Returns {} when the data is fine, or { field: 'message', ... } */
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

/* How much this account has already pushed through today. */
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

/* The data is already known to be good. This decides what happens to
   it. ORDER MATTERS - the first branch that is true wins. */
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

/* Capture -> validate -> apply rules -> record. Returns the whole
   story of what happened to one request. */
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

/* ======================== 3. SHOWING ===========================
   From here down, every function either reads the form or writes to
   the page. The deciding is already done.
   =============================================================== */

const $ = (sel) => document.querySelector(sel);
const FIELDS = ['account', 'payee', 'amount', 'category', 'reference'];

function readForm() {
  return {
    account:   $('#account').value,
    payee:     $('#payee').value,
    amount:    $('#amount').value,
    category:  $('#category').value,
    reference: $('#reference').value
  };
}

/* CSS owns what "wrong" looks like. JavaScript owns which fields
   are wrong. All this does is add or remove a class name. */
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

function renderAccounts() {
  const select = $('#account');
  const keep = select.value;
  select.innerHTML = accounts.map((a) =>
    '<option value="' + a.code + '">' + a.label + ' &mdash; ' +
    money(a.balance) + '</option>').join('');
  select.value = keep || accounts[0].code;
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

function row(label, value) {
  return '<div class="row"><span>' + label + '</span><span>' +
         value + '</span></div>';
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

function tile(value, label) {
  return '<div class="tile"><b>' + value + '</b><span>' + label +
         '</span></div>';
}

/* ======================== WIRING IT UP ========================= */

document.addEventListener('DOMContentLoaded', function () {
  renderAccounts();
  renderLedger();

  /* live checking: only complain about a field once it has been used */
  for (const name of FIELDS) {
    const input = $('#' + name);
    input.addEventListener('blur', function () {
      input.dataset.touched = 'yes';
      showErrors(validate(readForm()), true);
    });
    input.addEventListener('input', function () {
      if (input.dataset.touched === 'yes') {
        showErrors(validate(readForm()), true);
      }
    });
  }

  $('#reference').addEventListener('input', function () {
    $('#refCount').textContent = $('#reference').value.length;
  });

  $('#payForm').addEventListener('submit', function (event) {
    event.preventDefault();          // no reload - we handle it here

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

    /* A short pause so the pending state is visible. A real app would
       be waiting on a server here - that is Week 10. */
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

  $('#layerToggle').addEventListener('change', function (event) {
    document.body.classList.toggle('show-layers', event.target.checked);
  });
});
