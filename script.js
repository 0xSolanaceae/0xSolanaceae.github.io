const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const W = window.innerWidth;
const H = window.innerHeight;

canvas.width = W;
canvas.height = H;

const fontSize = 18;
const columns = Math.floor(W / fontSize);
const drops = [];
for (let i = 0; i < columns; i++) {
    drops.push(Math.floor(Math.random() * canvas.height)); // Random initial drop position
}
const str = "#()?/\\|{}[]";

function draw() {
    context.globalCompositeOperation = "destination-out";
    context.fillStyle = "rgba(0, 0, 0, 0.1)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = "source-over";

    context.font = "700 " + fontSize + "px 'Fira Code', monospace";
    context.fillStyle = "#000";
    for (let i = 0; i < columns; i++) {
        const index = Math.floor(Math.random() * str.length);
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Create fuzzy edges only around the characters
        context.shadowColor = "#000";
        context.shadowBlur = 10;
        context.fillText(str[index], x, y);

        // Reset shadow properties to avoid applying them to other elements
        context.shadowColor = "transparent";
        context.shadowBlur = 0;

        if (y >= canvas.height && Math.random() > 0.97) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

draw();
setInterval(draw, 35);
