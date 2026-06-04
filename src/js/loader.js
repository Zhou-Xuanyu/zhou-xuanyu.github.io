const loader = document.getElementById("loader");

Promise.all([
    document.readyState === "complete"
        ? Promise.resolve()
        : new Promise(r => window.addEventListener("load", r)),
    document.fonts.ready,
]).then(() => {
    loader?.classList.add("hidden");
});
