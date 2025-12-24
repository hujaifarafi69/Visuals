let arrayData = [];

function initArray() {
    arrayData = [];
    renderArray();
}

function arrayAdd() {
    const input = document.getElementById("arrayInput");
    if (!input) return;

    const value = input.value;
    if (value === "") return;

    arrayData.push(value);
    input.value = "";
    renderArray();
}

function arrayRemove() {
    if (arrayData.length === 0) return;
    arrayData.pop();
    renderArray();
}

function renderArray() {
    const area = document.getElementById("arrayVisual");
    if (!area) return;

    area.innerHTML = "";

    arrayData.forEach(val => {
        const block = document.createElement("div");
        block.className = "block";
        block.style.height = (Number(val) * 2 + 30) + "px";
        block.innerText = val;
        area.appendChild(block);
    });
}
