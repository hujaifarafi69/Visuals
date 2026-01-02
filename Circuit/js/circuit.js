document.addEventListener("DOMContentLoaded", () => {
    const circuitSelect = document.getElementById("CircuitSelect");
    if (!circuitSelect) return;

    circuitSelect.addEventListener("change", e => {
        const value = e.target.value;
        if (!value) return;

        if (value === "AC") {
            loadPage("Circuit/pages/ac.html", initAC);
        }

        if (value === "DC") {
            loadPage("Circuit/pages/dc.html", initDC);
        }

        circuitSelect.selectedIndex = 0;});
});
