
const $ = (id) => document.getElementById(id);

const current = $("current");
const target = $("target");
const intensity = $("intensity");

const STORAGE_KEY = "sensi-control-history";

function calculateSensitivity() {
  const atual = Number(current.value);
  const desejada = Number(target.value);
  const fator = Number(intensity.value) / 100;

  // Calcula uma aproximação entre os dois valores.
  const resultado =
    atual + (desejada - atual) * fator;

  return Math.round(resultado * 100) / 100;
}

function updateInterface() {
  $("currentValue").textContent = current.value;
  $("targetValue").textContent = target.value;
  $("intensityValue").textContent =
    intensity.value + "%";

  $("result").textContent =
    calculateSensitivity();
}

[current, target, intensity].forEach((input) => {
  input.addEventListener("input", updateInterface);
});

function getHistory() {
  try {
    const data = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function renderHistory() {
  const history = getHistory();
  const container = $("history");

  container.replaceChildren();

  if (history.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Nenhum ajuste salvo.";
    container.append(empty);
    return;
  }

  history.forEach((item) => {
    const entry = document.createElement("div");
    entry.className = "history-item";

    const title = document.createElement("strong");
    title.textContent = `${item.device}: ${item.result}`;

    const details = document.createElement("small");
    details.textContent =
      `Atual: ${item.current} · ` +
      `Alvo: ${item.target} · ${item.date}`;

    entry.append(title, details);
    container.append(entry);
  });
}

$("save").addEventListener("click", () => {
  const history = getHistory();

  const item = {
    device: $("device").value,
    current: Number(current.value),
    target: Number(target.value),
    intensity: Number(intensity.value),
    result: calculateSensitivity(),
    date: new Date().toLocaleString("pt-BR")
  };

  history.unshift(item);

  // Guarda apenas os 30 ajustes mais recentes.
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(history.slice(0, 30))
  );

  $("message").textContent = "Configuração salva!";
  renderHistory();
});

$("clear").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  $("message").textContent = "Histórico apagado.";
  renderHistory();
});

updateInterface();
renderHistory();

// Registra o Service Worker do PWA.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .catch((error) => {
        console.error("Erro no Service Worker:", error);
      });
  });
}
