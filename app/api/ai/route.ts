export async function POST(req: Request) {
    try {
        const { question, answer } = await req.json()

        // =========================
        // VALIDASI QUESTION
        // =========================
        if (!question) {
            return Response.json(
                {
                    error: "Question wajib diisi",
                },
                {
                    status: 400,
                }
            )
        }

        // =========================
        // CEK API KEY GROQ
        // =========================
        const apiKey = process.env.GROQ_API_KEY

        if (!apiKey) {
            return Response.json(
                {
                    error:
                        "GROQ_API_KEY belum ditemukan di environment variable",
                },
                {
                    status: 500,
                }
            )
        }

        // =========================
        // PROMPT AI
        // =========================
        const systemPrompt = `
Kamu adalah AI tutor pendidikan untuk aplikasi belajar
bernama "Sinau Bareng".

Tugas kamu adalah membantu siswa memahami materi
dengan bahasa Indonesia yang sederhana, santai, ramah,
dan mudah dipahami.

Ada dua kemungkinan:

1. Jika siswa hanya bertanya tentang suatu materi,
   berikan jawaban dan penjelasan yang jelas.

2. Jika siswa memberikan soal DAN jawaban siswa,
   periksa jawaban tersebut dan berikan penilaian,
   pembenaran, serta jawaban yang benar.

==================================================
ATURAN JAWABAN
==================================================

Jika hanya pertanyaan:

- Jawab pertanyaan dengan jelas.
- Jelaskan secara bertahap.
- Berikan contoh jika diperlukan.
- Jangan memberikan nilai secara asal.
- score boleh 0 jika tidak ada jawaban siswa.

Jika terdapat jawaban siswa:

- Nilai dari 0 sampai 100.
- Tentukan apakah jawabannya benar atau salah.
- Berikan feedback.
- Jelaskan bagian yang benar.
- Jelaskan bagian yang salah jika ada.
- Berikan pembenaran/koreksi.
- Berikan jawaban yang benar.
- Jelaskan cara mendapatkan jawaban tersebut.

==================================================
GAYA PENJELASAN
==================================================

Gunakan bahasa Indonesia yang mudah dipahami.

Untuk matematika:

1. Tuliskan informasi yang diketahui.
2. Tentukan rumus.
3. Masukkan angka.
4. Hitung.
5. Berikan kesimpulan.

Untuk pemrograman:

1. Jelaskan konsep.
2. Jelaskan logika.
3. Berikan contoh.
4. Jelaskan hasilnya.

Untuk soal teori:

1. Jelaskan konsep.
2. Hubungkan dengan pertanyaan.
3. Jelaskan alasannya.
4. Berikan kesimpulan.

==================================================
JIKA JAWABAN SISWA SALAH
==================================================

Gunakan bahasa yang ramah.

Jangan hanya mengatakan:
"Jawabanmu salah."

Jelaskan:

- bagian yang salah
- mengapa salah
- cara memperbaikinya
- jawaban yang benar

==================================================
JIKA JAWABAN SISWA BENAR
==================================================

Berikan apresiasi.

Contoh:

"Jawabanmu sudah tepat! 🎉"

Kemudian jelaskan mengapa jawabannya benar.

==================================================
CANDAAN DAN PENYEMANGAT
==================================================

Kamu boleh memberikan candaan ringan,
pantun, atau kalimat penyemangat.

Tidak wajib selalu menggunakan pantun.

Contoh:

"Ikan hiu makan tomat,
belajar rajin biar makin hebat! 🦈🍅"

==================================================
FORMAT OUTPUT
==================================================

WAJIB mengembalikan JSON valid.

Jangan menggunakan markdown.
Jangan menggunakan \`\`\`json.
Jangan memberikan teks di luar JSON.

Format:

{
    "answer": "",
    "tip": "",
    "score": 0,
    "isCorrect": false,
    "feedback": "",
    "correction": "",
    "correctAnswer": "",
    "explanation": "",
    "fun_fact": ""
}

Ketentuan:

answer:
Jawaban utama untuk pertanyaan siswa.

tip:
Tips belajar singkat.

score:
Nilai 0-100.
Jika tidak ada jawaban siswa, gunakan 0.

isCorrect:
true jika jawaban siswa benar.
false jika salah atau tidak ada jawaban siswa.

feedback:
Komentar terhadap jawaban siswa.

correction:
Pembenaran atau koreksi jawaban siswa.
Jika tidak ada jawaban siswa, isi dengan penjelasan singkat.

correctAnswer:
Jawaban yang benar.
Jika hanya bertanya tanpa memberikan jawaban siswa,
isi dengan jawaban utama.

explanation:
Penjelasan langkah demi langkah.

fun_fact:
Candaan, pantun, atau semangat belajar.

Pastikan JSON selalu valid.
`

        // =========================
        // USER PROMPT
        // =========================
        const userPrompt = answer
            ? `
Soal:
${question}

Jawaban siswa:
${answer}
`
            : `
Pertanyaan siswa:
${question}
`

        // =========================
        // REQUEST KE GROQ
        // =========================
        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    model: "openai/gpt-oss-120b",

                    messages: [
                        {
                            role: "system",
                            content: systemPrompt,
                        },
                        {
                            role: "user",
                            content: userPrompt,
                        },
                    ],

                    temperature: 0.7,

                    response_format: {
                        type: "json_object",
                    },
                }),
            }
        )

        // =========================
        // BACA RESPONSE GROQ
        // =========================
        const responseText = await response.text()

        console.log(
            "GROQ STATUS:",
            response.status
        )

        console.log(
            "GROQ RESPONSE:",
            responseText
        )

        // =========================
        // CEK GROQ ERROR
        // =========================
        if (!response.ok) {
            let errorMessage =
                "Gagal menghubungi Groq API"

            try {
                const errorData =
                    JSON.parse(responseText)

                errorMessage =
                    errorData?.error?.message ||
                    errorMessage
            } catch {
                // Response bukan JSON
                errorMessage =
                    responseText ||
                    errorMessage
            }

            return Response.json(
                {
                    error: errorMessage,
                },
                {
                    status: response.status,
                }
            )
        }

        // =========================
        // PARSE RESPONSE GROQ
        // =========================
        let data

        try {
            data = JSON.parse(responseText)
        } catch {
            return Response.json(
                {
                    error:
                        "Response dari Groq bukan JSON valid",
                },
                {
                    status: 500,
                }
            )
        }

        // =========================
        // AMBIL CONTENT AI
        // =========================
        const content =
            data?.choices?.[0]?.message?.content

        if (!content) {
            return Response.json(
                {
                    error:
                        "Response dari Groq kosong",
                },
                {
                    status: 500,
                }
            )
        }

        console.log(
            "AI RAW RESPONSE:",
            content
        )

        // =========================
        // PARSE JSON AI
        // =========================
        let aiResult

        try {
            aiResult =
                JSON.parse(content)
        } catch {
            return Response.json(
                {
                    error:
                        "Format response dari AI tidak valid",
                    raw: content,
                },
                {
                    status: 500,
                }
            )
        }

        // =========================
        // SCORE
        // =========================
        let score =
            Number(aiResult?.score) || 0

        score = Math.max(
            0,
            Math.min(100, score)
        )

        // =========================
        // RESPONSE
        // =========================
        return Response.json({
            answer:
                typeof aiResult?.answer ===
                    "string"
                    ? aiResult.answer
                    : "",

            tip:
                typeof aiResult?.tip ===
                    "string"
                    ? aiResult.tip
                    : "",

            score,

            isCorrect:
                Boolean(
                    aiResult?.isCorrect
                ),

            feedback:
                typeof aiResult?.feedback ===
                    "string"
                    ? aiResult.feedback
                    : "",

            correction:
                typeof aiResult?.correction ===
                    "string"
                    ? aiResult.correction
                    : "",

            correctAnswer:
                typeof aiResult?.correctAnswer ===
                    "string"
                    ? aiResult.correctAnswer
                    : "",

            explanation:
                typeof aiResult?.explanation ===
                    "string"
                    ? aiResult.explanation
                    : "",

            fun_fact:
                typeof aiResult?.fun_fact ===
                    "string"
                    ? aiResult.fun_fact
                    : "",
        })
    } catch (error) {
        console.error(
            "Review AI error:",
            error
        )

        return Response.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Terjadi kesalahan pada server",
            },
            {
                status: 500,
            }
        )
    }
}