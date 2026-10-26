const API_URL = "https://housetypeprediction.onrender.com";

const form = document.getElementById("predictionForm");
const formError = document.getElementById("formError");
const resultPlaceholder = document.getElementById("resultPlaceholder");
const resultContent = document.getElementById("resultContent");
const loadingContent = document.getElementById("loadingContent");

const presets = {
  brooklyn: { neighbourhood_group: "Brooklyn", neighbourhood: "Williamsburg", latitude: 40.718, longitude: -73.957, price: 185, minimum_nights: 3, availability_365: 240, number_of_reviews: 86, reviews_per_month: 1.8, calculated_host_listings_count: 2 },
  manhattan: { neighbourhood_group: "Manhattan", neighbourhood: "Harlem", latitude: 40.811, longitude: -73.946, price: 145, minimum_nights: 2, availability_365: 190, number_of_reviews: 142, reviews_per_month: 2.4, calculated_host_listings_count: 1 },
  queens: { neighbourhood_group: "Queens", neighbourhood: "Astoria", latitude: 40.764, longitude: -73.923, price: 105, minimum_nights: 1, availability_365: 310, number_of_reviews: 54, reviews_per_month: 1.2, calculated_host_listings_count: 3 }
};

const fields = [...form.elements].filter((element) => element.name);

function setFormValues(values) {
  fields.forEach((field) => {
    if (values[field.name] !== undefined) field.value = values[field.name];
  });
}

function formatPrediction(value) {
  return String(value).replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function showError(message) {
  formError.textContent = message;
}

function setLoading(isLoading) {
  resultPlaceholder.classList.toggle("hidden", isLoading);
  resultContent.classList.toggle("hidden", isLoading);
  loadingContent.classList.toggle("hidden", !isLoading);
  if (isLoading) resultContent.classList.remove("result-arrive");
}

function renderResult(data) {
  const probabilities = Array.isArray(data.probability) ? data.probability : [];
  const labels = ["Entire home / apt", "Private room", "Shared room"];
  const highestProbability = probabilities.length ? Math.max(...probabilities) : 0;
  document.getElementById("predictionValue").textContent = formatPrediction(data.prediction);
  document.getElementById("confidenceValue").textContent = `${Math.round(highestProbability * 100)}%`;
  document.getElementById("confidenceBar").style.width = `${Math.max(0, Math.min(100, highestProbability * 100))}%`;
  document.getElementById("resultTime").textContent = `just now`;
  document.getElementById("probabilityList").innerHTML = probabilities.map((probability, index) => {
    const label = labels[index] || `Class ${index + 1}`;
    const percent = Math.max(0, Math.min(100, probability * 100));
    return `<div class="probability-row"><div class="probability-name"><span>${label}</span><b>${Math.round(percent)}%</b></div><div class="probability-track"><span style="width:${percent}%"></span></div></div>`;
  }).join("");
  setLoading(false);
  resultContent.classList.remove("result-arrive");
  void resultContent.offsetWidth;
  resultContent.classList.add("result-arrive");
}

document.querySelectorAll(".preset").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".preset").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    setFormValues(presets[button.dataset.preset]);
    showError("");
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError("");
  if (!form.reportValidity()) return;
  const payload = {};
  fields.forEach((field) => {
    payload[field.name] = field.type === "number" ? Number(field.value) : field.value.trim();
  });
  setLoading(true);
  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      const detail = Array.isArray(data.detail) ? data.detail[0]?.msg : data.detail;
      throw new Error(detail || "The API rejected this listing.");
    }
    renderResult(data);
  } catch (error) {
    setLoading(false);
    showError(error.message.includes("fetch") ? "Could not reach the API. Make sure FastAPI is running on port 8000." : error.message);
  }
});
