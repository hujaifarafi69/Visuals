let stackData = [];

function initStack() {
    stackData = [];
    renderStack();
}

function stackPush() {
    const input = document.getElementById("stackInput");
    if (!input) return;

    const value = input.value;
    if (value === "") return;

    stackData.push(value);
    input.value = "";
    renderStack();
}

function stackPop() {
    if (stackData.length === 0) return;
    stackData.pop();
    renderStack();
}

function renderStack() {
    const area = document.getElementById("stackVisual");
    if (!area) return;

    area.innerHTML = "";

    stackData.forEach(val => {
        const block = document.createElement("div");
        block.className = "block";
        block.style.height = (Number(val) * 2 + 30) + "px";
        block.innerText = val;
        area.appendChild(block);
    });
}
