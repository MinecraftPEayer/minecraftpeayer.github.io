import type { Viewport } from 'next';

export async function generateMetadata() {
    return {
        title: '這是臺灣媒體認為的詐騙網站',
        description: '因為這不是https而且還有php',
    }
}

export const viewport: Viewport = {
    themeColor: '#FF0000'
}

const Lmao = () => {
    return (<div>
        <p>這網頁不是詐騙，但是如果你想被騙就點底下的按鈕</p>
        <button onClick={() => location.href = 'https://youtu.be/dQw4w9WgXcQ'}>如果你想被騙就點我</button>
    </div>)
}

export default Lmao;
    
