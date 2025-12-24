let queueData = [];

function initQueue() {
    queueData = [];
    renderQueue();
}

function queueAdd() {
    const input = document.getElementById("queueInput");
    if (!input) return;

    const value = input.value;
    if (value === "") return;

    queueData.push(value);
    input.value = "";
    renderQueue();
}

function queueRemove() {
    if (queueData.length === 0) return;
    queueData.shift();
    renderQueue();
}

function renderQueue() {
    const area = document.getElementById("queueVisual");
    if (!area) return;

    area.innerHTML = "";

    queueData.forEach(val => {
        const block = document.createElement("div");
        block.className = "block";
        block.style.height = (Number(val) * 2 + 30) + "px";
        block.innerText = val;
        area.appendChild(block);
    });
}
