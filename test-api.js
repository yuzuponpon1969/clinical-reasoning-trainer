// Native fetch used

async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/session/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                archetypeId: "child", 
                regionId: "knee", 
                categoryId: "fracture"
            })
        });
        
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body:", text);
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

test();
