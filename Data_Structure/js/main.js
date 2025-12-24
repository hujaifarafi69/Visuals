document.addEventListener("DOMContentLoaded", () => {
    const dsSelect = document.getElementById("dsSelectDS");
    if (!dsSelect) return;

    dsSelect.addEventListener("change", e => {
        const value = e.target.value;
        if (!value) return;

        if (value === "array") {
            loadPage("Data_Structure/pages/array.html", initArray);
        }

        if (value === "stack") {
            loadPage("Data_Structure/pages/stack.html", initStack);
        }

        if (value === "queue") {
            loadPage("Data_Structure/pages/queue.html", initQueue);
        }

        dsSelect.selectedIndex = 0;
    });
});
