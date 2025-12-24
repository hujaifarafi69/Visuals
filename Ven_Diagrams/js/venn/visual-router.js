document.addEventListener("DOMContentLoaded", () => {
  const vennSelect = document.getElementById("vennSelect");
  if (!vennSelect) return;

  vennSelect.addEventListener("change", e => {
    const value = e.target.value;
    if (!value) return;

    if (value === "venn1") loadPage("Ven_Diagrams/pages/venn1.html", initVenn1);
    if (value === "venn2") loadPage("Ven_Diagrams/pages/venn2.html", initVenn2);
    if (value === "venn3") loadPage("Ven_Diagrams/pages/venn3.html", initVenn3);

    e.target.selectedIndex = 0; // reset dropdown
  });
});
