// =========================
// Generic Page Loader
// =========================
function loadPage(path, callback) {
    fetch(path)
        .then(res => {
            if (!res.ok) throw new Error("Page not found: " + path);
            return res.text();
        })
        .then(html => {
            document.getElementById('content').innerHTML = html;
            if (callback) callback(); // ✅ run initialization after page is loaded
        })
        .catch(err => {
            console.error(err);
            document.getElementById('content').innerHTML =
                "<p style='color:red;'>Failed to load content.</p>";
        });
}
