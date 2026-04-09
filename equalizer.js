function equalizePanels() {
    var left = document.getElementById('leftPanel');
    var right = document.getElementById('rightPanel');

    // Önce her ikisini sıfırla
    left.style.height = 'auto';
    right.style.height = 'auto';

    // Sadece masaüstünde yükseklikleri eşitle
    if (window.innerWidth >= 768) {
        var h = Math.max(left.offsetHeight, right.offsetHeight);
        left.style.height = h + 'px';
        right.style.height = h + 'px';
    }
}

window.addEventListener('load', equalizePanels);
window.addEventListener('resize', equalizePanels);