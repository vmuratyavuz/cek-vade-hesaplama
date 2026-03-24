function equalizePanels() {
    if (window.innerWidth < 768) return;
    var left = document.getElementById('leftPanel');
    var right = document.getElementById('rightPanel');
    left.style.height = 'auto';
    right.style.height = 'auto';
    var h = left.offsetHeight;
    left.style.height = h + 'px';
    right.style.height = h + 'px';
}

window.addEventListener('load', equalizePanels);
window.addEventListener('resize', equalizePanels);