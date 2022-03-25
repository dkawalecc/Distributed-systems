const resultContainer = document.querySelector("[data-result]");
const selectFirst = document.querySelector("[data-first]");
const selectSecond = document.querySelector("[data-second]");
const selectThird = document.querySelector("[data-third]");
const submitFirstForm = document.querySelector("[data-submit-first]");
const submitSecondForm = document.querySelector("[data-submit-second]");
const submitThirdForm = document.querySelector("[data-submit-third]");
const submitBtn = document.querySelector("[data-submit-btn]");

const apiUrl = "http://localhost:3030";

// let teams = [];
let seasons = [];

const loadFirstForm = async () => {
  try {
    console.log("Loading FIRST");
    const response = await fetch(`${apiUrl}/api/teams`);
    const data = await response.json();

    for (let team of data[1]) {
      selectFirst.options.add(new Option(team.name, team.id));
    }
    $(selectFirst).selectpicker("refresh");
  } catch (e) {
    console.error(e);
  }
};

const loadSecondForm = async () => {
  try {
    console.log("Loading SECOND");
    // await loadFirstForm();
    const l = selectSecond.options.length;
    for (let i = 1; i < l; i++) {
      selectSecond.options.remove(1);
    }

    const teamId = parseInt(
      selectFirst.options[selectFirst.selectedIndex].value
    );

    const response = await fetch(`${apiUrl}/api/teams/${teamId}`);
    const data = await response.json();
    for (player of data) {
      selectSecond.options.add(new Option(player.fullName, player.id));
    }
  } catch (e) {
    console.error(e);
  }
};

const loadThirdForm = async () => {
  try {
    console.log("Loading THIRD");
    // await loadSecondForm();
    const l = selectThird.options.length;
    for (let i = 1; i < l; i++) {
      selectThird.options.remove(1);
    }

    const playerId = parseInt(
      selectSecond.options[selectSecond.selectedIndex].value
    );

    const response = await fetch(`${apiUrl}/api/players/${playerId}`);
    const data = await response.json();

    seasons = [];
    for (s of data[1]) {
      if (!seasons.includes(s.season)) {
        const season =
          s.season.substring(0, s.season.length / 2) +
          "/" +
          s.season.substring(s.season.length / 2, s.season.length) +
          " " +
          s.team.name;
        selectThird.options.add(new Option(season, season), 0);
        seasons.push(s.season);
      }
    }
  } catch (e) {
    console.error(e);
  }
};

loadFirstForm();
resultContainer.innerHTML = `<img class="img-fluid rounded" style="position: relative; top: 20%" src='https://nhl.bamcontent.com/images/photos/301799740/2568x1444/cut.jpg'/>`;
selectFirst.addEventListener("change", async () => {
  selectSecond.disabled = false;

  const l = selectThird.options.length;
  for (let i = 1; i < l; i++) {
    selectThird.options.remove(1);
  }
  selectThird.disabled = true;
  submitBtn.disabled = true;
  await loadSecondForm();
  $(selectSecond).selectpicker("refresh");
  $(selectThird).selectpicker("refresh");
});

// loadSecondForm();
selectSecond.addEventListener("change", async () => {
  selectThird.disabled = false;
  submitBtn.disabled = true;
  await loadThirdForm();
  $(selectThird).selectpicker("refresh");
});

// loadThirdForm();
const third_handle = selectThird.addEventListener("change", function () {
  submitBtn.disabled = false;
  $(selectThird).selectpicker("refresh");
});

submitBtn.addEventListener("click", async (event) => {
  event.preventDefault();
  try {
    const response = await fetch(
      `${apiUrl}/api/nhl?first=${selectFirst.value}&second=${selectSecond.value}&third=${selectThird.value}`
    );

    const res = await response.text();
    if (res == "{}") resultContainer.innerHTML = "No data found";
    else resultContainer.innerHTML = res;
  } catch (e) {
    alert(e.message);
    resultContainer.innerHTML = e.message;
    console.error(e);
  }
  selectThird.removeEventListener("change", third_handle);
});
