document.querySelectorAll('pre code').forEach(function(block) {
    var lines = block.innerHTML.split('\n');
    if (lines[lines.length - 1] === '') lines.pop();
    block.innerHTML = lines.map(function(line) {
        return '<span class="line">' + (line || '​') + '</span>';
    }).join('');
});
