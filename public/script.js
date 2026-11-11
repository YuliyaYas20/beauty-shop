const loadBtn = document.getElementById("loadBtn");
const itemsList = document.getElementById("itemsList");
const loader = document.getElementById("loader");

loadBtn.addEventListener("click", async () => {
  try {
    loader.style.display = "block";
    itemsList.innerHTML = "";

    const response = await fetch("/items");

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
  } catch (error) {
    console.error("Не вдалося завантажити товари:", error);
    itemsList.innerHTML = `<li style="color: red;">Помилка при завантаженні товарів</li>`;
  } finally {
    loader.style.display = "none";
  }
});
