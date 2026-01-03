function circuitDOMReady() {
    return (
        document.getElementById("workspace") &&
        document.getElementById("wireCanvas") &&
        document.getElementById("graphCanvas")
    );
}

document.addEventListener("DOMContentLoaded", () => {
    const circuitSelect = document.getElementById("CircuitSelect");
    if (!circuitSelect) return;

    circuitSelect.addEventListener("change", e => {
        const value = e.target.value;
        if (!value) return;

        if (value === "AC") {
            loadPage("Circuit/pages/ac.html", () => {
                if (typeof initAC === "function") initAC();
            });
        }

        if (value === "DC") {
            loadPage("Circuit/pages/dc.html", () => {
                if (typeof initDC === "function") initDC();
            });
        }

        circuitSelect.selectedIndex = 0;
    });
});
