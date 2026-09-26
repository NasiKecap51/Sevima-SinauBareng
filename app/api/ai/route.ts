export async function POST(req: Request) {
    try {
        const { question, answer } = await req.json();

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-120b",
                messages: [
                    {
                        role: "system",
                        content: "Kamu adalah asisten pendidikan yang menilai jawaban siswa untuk soal literasi/numerasi. Berikan skor 0-100 dan feedback singkat yang membangun dalam Bahasa Indonesia. Balas HANYA dalam format JSON persis seperti ini, tanpa teks lain: {\"score\": number, \"feedback\": string}"
                    },
                    { role: "user", content: `Soal: ${question}\nJawaban siswa: ${answer}` },
                ],
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Groq API error:", JSON.stringify(data));
            return Response.json({ error: data }, { status: 500 });
        }

        const aiResult = JSON.parse(data.choices[0].message.content);
        return Response.json(aiResult);

    } catch (err) {
        console.error("Route crash:", err);
        return Response.json({ error: String(err) }, { status: 500 });
    }
}