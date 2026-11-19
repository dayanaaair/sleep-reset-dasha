const STORAGE_KEY = "sleep-reset-dasha-v1";
const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
state.answers ||= {};
state.completed ||= {};
state.sort ||= {};

const situations = [
  "You feel sleepy at 5 p.m. because it's already dark.",
  "You suddenly want to stay at home more.",
  "You feel nostalgic when you see autumn leaves.",
  "You feel more motivated because everyone around you is getting back into a productive routine after summer.",
  "You struggle to get out of bed in the morning.",
  "September makes you want to completely reset your life."
];

const meanings = [
  ["to go to bed at roughly the same time every night", "stick to a consistent bedtime"],
  ["lacking energy and moving or thinking more slowly than usual", "sluggish"],
  ["to press a button to stop your alarm temporarily and sleep for a few more minutes", "hit the snooze button"],
  ["the body’s natural 24-hour cycle that regulates sleep and wakefulness", "circadian rhythm"],
  ["irregular or disrupted patterns of sleeping and waking", "disturbed sleeping patterns"],
  ["to regularly experience something unpleasant or difficult", "suffer from"],
  ["to get out of bed very quickly and energetically", "leap out of bed"]
];

const fillItems = [
  ["I’ve been going to bed at 2 a.m. all summer. I really need to ______ before I go back to work.", "restore my sleep schedule"],
  ["I only meant to ______ once, but I ended up sleeping for another hour.", "hit the snooze button"],
  ["The shorter days seem to make me ______. I’ve been feeling less energetic recently.", "experience a dip in mood"],
  ["Staying up until 3 a.m. every night can really ______.", "throw your sleep schedule off"]
];

const choiceItems = [
  ["You move to a new time zone and suddenly feel sleepy at 3 p.m.", ["circadian rhythm", "sluggish", "disturbed sleeping patterns"], "circadian rhythm"],
  ["You wake up, look at the clock and think, “I have another 10 minutes...”", ["hit the snooze button", "leap out of bed", "stick to a consistent bedtime"], "hit the snooze button"],
  ["You stay up until 4 a.m. watching a series and sleep until noon.", ["throw your sleep schedule off", "suffer from", "a dip in mood"], "throw your sleep schedule off"],
  ["You want to start waking up at 7 a.m. again after a summer of late mornings.", ["restore your sleep schedule", "stick to a consistent bedtime", "hit the snooze button"], "restore your sleep schedule"]
];

const reviewItems = [
  ["If you want to restore your sleep schedule, try going to bed and waking up at roughly the same time every day.", true, ""],
  ["I’ve noticed a drop in mood since the days started getting shorter.", true, ""],
  ["If you have disturbed sleeping habits, try to keep your bedtime and wake-up time consistent.", false, "disturbed sleeping patterns"],
  ["Going to bed at a different time every night makes it difficult to stick to a consistent bedtime.", true, ""],
  ["I was so tired this morning that I hit the alarm button three times.", false, "hit the snooze button"],
  ["My alarm went off at 6 a.m., but I managed to leap out of bed straight away.", true, ""],
  ["I always feel sluggish after a night of poor sleep.", true, ""],
  ["I’ve been suffering with disturbed sleeping patterns since I started working night shifts.", false, "suffering from"],
  ["Getting plenty of daylight in the morning can help regulate your circadian rhythm.", true, ""],
  ["I try to keep to a consistent bedtime during the week.", true, ""],
  ["I always leap out of bed when my alarm goes off because I’m a morning person.", true, ""]
];

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateProgress();
}

function normalize(value) {
  return value.toLowerCase().replace(/[’‘]/g, "'").replace(/[.,!?]/g, "").replace(/\s+/g, " ").trim();
}

function setFeedback(node, score, total) {
  node.className = `feedback ${score === total ? "success" : "error"}`;
  node.textContent = score === total ? `Perfect — ${score}/${total} correct.` : `${score}/${total} correct. Check the highlighted answers and try again.`;
}

function renderSorting() {
  const bank = document.querySelector("#situationBank");
  situations.forEach((text, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "situation-card";
    card.draggable = true;
    card.dataset.id = index;
    card.textContent = text;
    card.addEventListener("click", () => {
      document.querySelectorAll(".situation-card").forEach(item => item.classList.remove("selected"));
      card.classList.add("selected");
    });
    card.addEventListener("dragstart", event => event.dataTransfer.setData("text/plain", String(index)));
    const category = state.sort[index];
    const destination = category ? document.querySelector(`.dropzone[data-category="${category}"] .drop-items`) : bank;
    destination.append(card);
  });

  document.querySelectorAll(".dropzone").forEach(zone => {
    zone.addEventListener("click", event => {
      if (event.target.closest(".situation-card")) return;
      const selected = document.querySelector(".situation-card.selected");
      if (selected) moveSituation(selected.dataset.id, zone.dataset.category);
    });
    zone.addEventListener("dragover", event => { event.preventDefault(); zone.classList.add("drag-over"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
    zone.addEventListener("drop", event => {
      event.preventDefault();
      zone.classList.remove("drag-over");
      moveSituation(event.dataTransfer.getData("text/plain"), zone.dataset.category);
    });
  });
  bank.addEventListener("dragover", event => event.preventDefault());
  bank.addEventListener("drop", event => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    delete state.sort[id];
    bank.append(document.querySelector(`.situation-card[data-id="${id}"]`));
    saveState();
  });
}

function moveSituation(id, category) {
  state.sort[id] = category;
  const card = document.querySelector(`.situation-card[data-id="${id}"]`);
  document.querySelector(`.dropzone[data-category="${category}"] .drop-items`).append(card);
  card.classList.remove("selected");
  saveState();
}

function renderMeanings() {
  const container = document.querySelector("#meaningExercise");
  meanings.forEach(([definition], index) => {
    const row = document.createElement("div");
    row.className = "match-row";
    row.innerHTML = `<label for="meaning-${index}">${definition}</label><input id="meaning-${index}" autocomplete="off" placeholder="Type the phrase">`;
    const input = row.querySelector("input");
    input.value = state.answers[`meaning-${index}`] || "";
    input.addEventListener("input", () => { state.answers[`meaning-${index}`] = input.value; saveState(); });
    container.append(row);
  });
}

function checkMeanings() {
  let score = 0;
  meanings.forEach(([, answer], index) => {
    const input = document.querySelector(`#meaning-${index}`);
    const correct = normalize(input.value) === normalize(answer);
    input.classList.toggle("is-correct", correct);
    input.classList.toggle("is-wrong", !correct);
    if (correct) score++;
  });
  setFeedback(document.querySelector("#meaningFeedback"), score, meanings.length);
  if (score === meanings.length) state.completed.vocabulary = true;
  saveState();
}

function renderFill() {
  const options = ["", ...fillItems.map(item => item[1])];
  const container = document.querySelector("#fillExercise");
  fillItems.forEach(([sentence], index) => {
    const row = document.createElement("div");
    row.className = "fill-row";
    const selectOptions = options.map(value => `<option value="${value}">${value || "Choose a phrase"}</option>`).join("");
    row.innerHTML = `<strong>${index + 1}.</strong><label for="fill-${index}">${sentence}</label><select id="fill-${index}">${selectOptions}</select>`;
    const select = row.querySelector("select");
    select.value = state.answers[`fill-${index}`] || "";
    select.addEventListener("change", () => { state.answers[`fill-${index}`] = select.value; saveState(); });
    container.append(row);
  });
}

function checkFill() {
  let score = 0;
  fillItems.forEach(([, answer], index) => {
    const select = document.querySelector(`#fill-${index}`);
    const correct = select.value === answer;
    select.classList.toggle("is-correct", correct);
    select.classList.toggle("is-wrong", !correct);
    if (correct) score++;
  });
  state.answers.fillPassed = score === fillItems.length;
  setFeedback(document.querySelector("#fillFeedback"), score, fillItems.length);
  updatePracticeCompletion();
}

function renderChoices() {
  const container = document.querySelector("#choiceExercise");
  choiceItems.forEach(([situation, options], index) => {
    const card = document.createElement("article");
    card.className = "choice-card";
    card.innerHTML = `<p>${situation}</p>` + options.map(option => `<label><input type="radio" name="choice-${index}" value="${option}"> ${option}</label>`).join("") + `<textarea placeholder="Explain why..." aria-label="Explain your answer"></textarea>`;
    card.querySelectorAll("input").forEach(input => {
      input.checked = state.answers[`choice-${index}`] === input.value;
      input.addEventListener("change", () => { state.answers[`choice-${index}`] = input.value; saveState(); });
    });
    const note = card.querySelector("textarea");
    note.value = state.answers[`choice-note-${index}`] || "";
    note.addEventListener("input", () => { state.answers[`choice-note-${index}`] = note.value; saveState(); });
    container.append(card);
  });
}

function checkChoices() {
  let score = 0;
  choiceItems.forEach(([, , answer], index) => {
    const card = document.querySelectorAll(".choice-card")[index];
    const chosen = card.querySelector("input:checked")?.value;
    const correct = chosen === answer;
    card.classList.toggle("is-correct", correct);
    card.classList.toggle("is-wrong", !correct);
    if (correct) score++;
  });
  state.answers.choicePassed = score === choiceItems.length;
  setFeedback(document.querySelector("#choiceFeedback"), score, choiceItems.length);
  updatePracticeCompletion();
}

function updatePracticeCompletion() {
  if (state.answers.fillPassed && state.answers.choicePassed) state.completed.practice = true;
  saveState();
}

function renderReview() {
  const container = document.querySelector("#reviewExercise");
  reviewItems.forEach(([sentence], index) => {
    const row = document.createElement("div");
    row.className = "review-row";
    row.innerHTML = `<p>${sentence}</p><div class="review-actions"><label><input type="radio" name="review-${index}" value="natural"><span>✓ Natural</span></label><label><input type="radio" name="review-${index}" value="fix"><span>Fix it</span></label></div><input type="text" id="review-fix-${index}" placeholder="Type the corrected phrase">`;
    row.querySelectorAll("input[type=radio]").forEach(input => {
      input.checked = state.answers[`review-${index}`] === input.value;
      input.addEventListener("change", () => { state.answers[`review-${index}`] = input.value; saveState(); });
    });
    const fix = row.querySelector("input[type=text]");
    fix.value = state.answers[`review-fix-${index}`] || "";
    fix.addEventListener("input", () => { state.answers[`review-fix-${index}`] = fix.value; saveState(); });
    container.append(row);
  });
}

function checkReview() {
  let score = 0;
  reviewItems.forEach(([, natural, correction], index) => {
    const row = document.querySelectorAll(".review-row")[index];
    const choice = row.querySelector("input[type=radio]:checked")?.value;
    const fix = row.querySelector("input[type=text]").value;
    const correct = natural ? choice === "natural" : choice === "fix" && normalize(fix).includes(normalize(correction));
    row.classList.toggle("is-correct", correct);
    row.classList.toggle("is-wrong", !correct);
    if (correct) score++;
  });
  setFeedback(document.querySelector("#reviewFeedback"), score, reviewItems.length);
  if (score === reviewItems.length) state.completed.review = true;
  saveState();
}

function bindSavedFields() {
  document.querySelectorAll("[data-save]").forEach(field => {
    field.value = state.answers[field.dataset.save] || "";
    field.addEventListener("input", () => { state.answers[field.dataset.save] = field.value; saveState(); });
  });
}

function bindCompletionButtons() {
  document.querySelectorAll("[data-complete]").forEach(button => {
    const key = button.dataset.complete;
    const refresh = () => {
      button.classList.toggle("done", Boolean(state.completed[key]));
      button.textContent = state.completed[key] ? "✓ Section complete" : "Mark section complete";
    };
    refresh();
    button.addEventListener("click", () => { state.completed[key] = !state.completed[key]; saveState(); refresh(); });
  });
}

function updateProgress() {
  const sections = ["lead-in", "watch", "reading", "vocabulary", "practice", "cases", "review"];
  const complete = sections.filter(section => state.completed[section]).length;
  const percent = Math.round((complete / sections.length) * 100);
  document.documentElement.style.setProperty("--progress", `${percent}%`);
  document.querySelector("#progressText").textContent = `${percent}%`;
  document.querySelector("#mobileProgressBar").style.setProperty("--progress", `${percent}%`);
}

document.querySelector("#checkMeanings").addEventListener("click", checkMeanings);
document.querySelector("#resetMeanings").addEventListener("click", () => {
  meanings.forEach((_, index) => { state.answers[`meaning-${index}`] = ""; const input = document.querySelector(`#meaning-${index}`); input.value = ""; input.className = ""; });
  document.querySelector("#meaningFeedback").textContent = "";
  state.completed.vocabulary = false;
  saveState();
});
document.querySelector("#checkFill").addEventListener("click", checkFill);
document.querySelector("#checkChoices").addEventListener("click", checkChoices);
document.querySelector("#checkReview").addEventListener("click", checkReview);
document.querySelector("#progressButton").addEventListener("click", () => document.querySelector("#finish").scrollIntoView({ behavior: "smooth" }));
document.querySelector("#resetAll").addEventListener("click", () => {
  if (confirm("Reset all answers and lesson progress?")) { localStorage.removeItem(STORAGE_KEY); location.reload(); }
});

renderSorting();
renderMeanings();
renderFill();
renderChoices();
renderReview();
bindSavedFields();
bindCompletionButtons();
updateProgress();
