const loadBtn = document.getElementById("loadBtn");
const itemsList = document.getElementById("itemsList");
const loader = document.getElementById("loader");

async function payloadHash(obj) {
  const data = new TextEncoder().encode(JSON.stringify(obj));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getOrReuseKey(payload) {
  const hash = await payloadHash(payload);
  const storageKey = `idem:${hash}`;
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;

  const fresh = crypto.randomUUID();
  localStorage.setItem(storageKey, fresh);
  return fresh;
}

let consecutiveFailures = 0;
const FAILURE_THRESHOLD = 3;

function updateDegradedState(isSuccess) {
  const banner = document.getElementById("degraded-banner");
  const buttons = document.querySelectorAll("button");

  if (isSuccess) {
    consecutiveFailures = 0;
    if (banner) banner.style.display = "none";
    buttons.forEach((btn) => (btn.disabled = false));
    return;
  }

  consecutiveFailures += 1;
  if (consecutiveFailures >= FAILURE_THRESHOLD) {
    if (banner) banner.style.display = "block";
    buttons.forEach((btn) => (btn.disabled = true));

    setTimeout(() => {
      consecutiveFailures = 0;
      if (banner) banner.style.display = "none";
      buttons.forEach((btn) => (btn.disabled = false));
    }, 5000);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function calcBackoff(baseMs, attempt, jitter = true) {
  const exp = baseMs * 2 ** attempt;
  const jitterMs = jitter ? Math.floor(Math.random() * 150) : 0;
  return exp + jitterMs;
}

async function fetchWithResilience(url, opts = {}) {
  const {
    retry = {},
    idempotencyKey,
    requestId,
    _attempt = 0,
    ...fetchInit
  } = opts;

  const {
    retries = 2,
    baseDelayMs = 300,
    timeoutMs = 1000,
    jitter = true,
  } = retry;

  const headers = new Headers(fetchInit.headers || {});
  headers.set("Content-Type", "application/json");
  if (idempotencyKey) {
    headers.set("Idempotency-Key", idempotencyKey);
  }
  headers.set("X-Request-Id", requestId || crypto.randomUUID());

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...fetchInit,
      headers,
      signal: controller.signal,
    });

    if (res.status === 429 && retries >= 1) {
      const retryAfterSec = Number(res.headers.get("Retry-After") || 2);
      logMessage(
        `429 Too Many Requests. Чекаємо ${retryAfterSec} с (Retry-After)...`,
      );
      await sleep(retryAfterSec * 1000);
      return fetchWithResilience(url, {
        ...opts,
        _attempt: _attempt + 1,
        retry: { ...retry, retries: retries - 1 },
      });
    }

    if ([500, 502, 503, 504].includes(res.status) && retries >= 1) {
      const delay = calcBackoff(baseDelayMs, _attempt, jitter);
      logMessage(`Помилка ${res.status}. Повтор через ${delay} мс...`);
      await sleep(delay);
      return fetchWithResilience(url, {
        ...opts,
        _attempt: _attempt + 1,
        retry: { ...retry, retries: retries - 1 },
      });
    }

    updateDegradedState(res.ok);
    return res;
  } catch (err) {
    if (retries >= 1) {
      const delay = calcBackoff(baseDelayMs, _attempt, jitter);
      logMessage(
        `Таймаут (>1с) або збій мережі (${err.name}). Повтор через ${delay} мс...`,
      );
      await sleep(delay);
      return fetchWithResilience(url, {
        ...opts,
        _attempt: _attempt + 1,
        retry: { ...retry, retries: retries - 1 },
      });
    }

    updateDegradedState(false);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function logMessage(msg) {
  const logEl = document.getElementById("log-output");
  if (logEl) {
    logEl.textContent =
      `${new Date().toLocaleTimeString()}: ${msg}\n` + logEl.textContent;
  }
}

loadBtn.addEventListener("click", async () => {
  try {
    loader.style.display = "block";
    itemsList.innerHTML = "";

    const response = await fetchWithResilience("/items");

    if (!response.ok) {
      throw new Error(`Помилка сервера: ${response.status}`);
    }

    const items = await response.json();

    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "item-card";
      li.innerHTML = `
        <span class="item-name">${item.name}</span>
        <span class="item-id">#${item.id}</span>
      `;
      itemsList.appendChild(li);
    });

    logMessage(
      `GET /items (${response.status}) | X-Request-Id: ${response.headers.get("X-Request-Id")}`,
    );
  } catch (error) {
    console.error("Не вдалося завантажити товари:", error);
    itemsList.innerHTML = `<li style="color: red;">Помилка при завантаженні товарів</li>`;
    logMessage(`Помилка завантаження: ${error.message}`);
  } finally {
    loader.style.display = "none";
  }
});

document.getElementById("create-btn")?.addEventListener("click", async () => {
  const payload = {
    name: document.getElementById("item-name").value,
    price: Number(document.getElementById("item-price").value),
    stockQuantity: Number(document.getElementById("item-qty").value),
  };

  try {
    const idemKey = await getOrReuseKey(payload);
    const res = await fetchWithResilience("/items", {
      method: "POST",
      body: JSON.stringify(payload),
      idempotencyKey: idemKey,
    });
    const data = await res.json();
    logMessage(
      `POST /items (${res.status}) | Idempotency-Key: ${idemKey} | Відповідь: ${JSON.stringify(data)}`,
    );
  } catch (e) {
    logMessage(`Помилка створення товару: ${e.message}`);
  }
});

document
  .getElementById("double-click-btn")
  ?.addEventListener("click", async () => {
    const payload = {
      name: document.getElementById("item-name").value,
      price: Number(document.getElementById("item-price").value),
      stockQuantity: Number(document.getElementById("item-qty").value),
    };

    try {
      const idemKey = await getOrReuseKey(payload);
      logMessage(`Відправка 2 паралельних запитів із ключем ${idemKey}...`);

      const [res1, res2] = await Promise.all([
        fetchWithResilience("/items", {
          method: "POST",
          body: JSON.stringify(payload),
          idempotencyKey: idemKey,
        }),
        fetchWithResilience("/items", {
          method: "POST",
          body: JSON.stringify(payload),
          idempotencyKey: idemKey,
        }),
      ]);

      const [data1, data2] = await Promise.all([res1.json(), res2.json()]);
      logMessage(`Результат 1 (${res1.status}): ${JSON.stringify(data1)}`);
      logMessage(`Результат 2 (${res2.status}): ${JSON.stringify(data2)}`);
    } catch (e) {
      logMessage(`Помилка при подвійному запиті: ${e.message}`);
    }
  });
