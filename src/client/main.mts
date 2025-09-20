import "./index.css";

async function getOrCreateUniqueId(): Promise<string> {
    const id = window.localStorage.getItem("ccccccclick-unique-id");
    if (id) return id;
    const newId = window.crypto.randomUUID();
    window.localStorage.setItem("ccccccclick-unique-id", newId);
    return newId;
}

type ApiResponse = {
    current: number;
    userCount: number;
} | string;

interface Api {
    get(): Promise<ApiResponse>;
    post(id: string): Promise<ApiResponse>;
}

function createApi(): Api {
    const baseUrl = '/api/click';
    return {
        async get() {
            const response = await fetch(baseUrl);
            if (!response.ok) return 'Error';
            const data = await response.text();
            if (data.startsWith('{')) {
                return JSON.parse(data) as { current: number; userCount: number };
            }
            return data;
        },
        async post(id: string) {
            const response = await fetch(baseUrl, {
                method: 'POST',
                body: JSON.stringify({ id }),
            });
            if (!response.ok) return 'Error';
            const data = await response.text();
            if (data.startsWith('{')) {
                return JSON.parse(data) as { current: number; userCount: number };
            }
            return data;
        },
    };
}

window.addEventListener('load', async () => {
    const id = await getOrCreateUniqueId();
    const api = createApi();
    const container = document.getElementById('container') as HTMLDivElement;
    const userCountSpan = document.getElementById('usercount') as HTMLSpanElement;
    const countSpan = document.getElementById('count') as HTMLSpanElement;

    function updateText(response: ApiResponse) {
        countSpan.textContent = formatCount(typeof response === 'string' ? response : response.current);
        if (typeof response !== 'string') {
            userCountSpan.textContent = `${formatCount(response.userCount)} 人に `;
        }
    }

    // 取得した文字列を数値に変換して3桁区切りの文字列を返す
    function formatCount(text: string|number): string {
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
        const response = await api.post(id);
        updateText(response);
    });

    setTimeout(async () => {
        const response = await api.get();
        updateText(response);
    }, 3_000);

    const response = await api.get();
    updateText(response);
});
