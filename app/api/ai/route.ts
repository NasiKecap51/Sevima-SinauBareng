export async function POST(req: Request) {
    const { userInput } = await req.json();

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "[INSTRUKSI SESUAI KONTEKS SOAL NANTI]" },
                { role: "user", content: userInput },
            ],
        }),
    });

    const data = await response.json();
    return Response.json({ result: data.choices[0].message.content });
}