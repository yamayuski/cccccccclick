import "./index.css";

window.addEventListener('load', async () => {
    const container = document.getElementById('container') as HTMLDivElement;
    const countSpan = document.getElementById('count') as HTMLSpanElement;

    // 取得した文字列を数値に変換して3桁区切りの文字列を返す
    function formatCount(text: string): string {
        const n = Number(String(text).trim());
        if (!Number.isFinite(n)) return '0';
        return n.toLocaleString('ja-JP');
    }

    container.addEventListener('click', async (e) => {
        const x = e.offsetX;
        const y = e.offsetY;
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        container.appendChild(ripple);
        setTimeout(() => {
            ripple.remove();
        }, 600);
        const response = await fetch('/api/click', { method: 'POST' });
        const newCount = await response.text();
        countSpan.textContent = formatCount(newCount);
    });

    const response = await fetch('/api/click');
    const currentCount = await response.text();
    countSpan.textContent = formatCount(currentCount);
});
