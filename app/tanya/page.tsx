"use client"

import {
    Bot,
    Send,
    Sparkles,
    User,
    Lightbulb,
    Loader2,
    Trash2,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface Message {
    id: number
    role: "user" | "ai"
    content: string
    tip?: string
}

export default function TanyaPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            role: "ai",
            content:
                "Halo! 👋 Aku AI dari Sinau Bareng. Mau belajar apa hari ini? Kamu bisa tanya matematika, pemrograman, bahasa Inggris, atau materi lainnya. 😄",
            tip: "Tidak ada pertanyaan yang terlalu sederhana. Yuk, tanya saja!",
        },
    ])

    const [question, setQuestion] = useState("")
    const [loading, setLoading] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        })
    }, [messages, loading])

    const handleSubmit = async (
        e?: React.FormEvent
    ) => {
        e?.preventDefault()

        const text = question.trim()

        if (!text || loading) {
            return
        }

        const userMessage: Message = {
            id: Date.now(),
            role: "user",
            content: text,
        }

        setMessages((prev) => [
            ...prev,
            userMessage,
        ])

        setQuestion("")
        setLoading(true)

        try {
            const response = await fetch("/api/ai", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    question: text,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(
                    data?.error ||
                    "Gagal mendapatkan jawaban AI"
                )
            }

            const aiMessage: Message = {
                id: Date.now() + 1,
                role: "ai",
                content: data.answer,
                tip: data.tip,
            }

            setMessages((prev) => [
                ...prev,
                aiMessage,
            ])
        } catch (error) {
            console.error("Ask AI error:", error)

            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    role: "ai",
                    content:
                        error instanceof Error
                            ? error.message
                            : "Maaf, terjadi kesalahan saat menghubungi AI.",
                },
            ])
        } finally {
            setLoading(false)
        }
    }

    const clearChat = () => {
        setMessages([
            {
                id: Date.now(),
                role: "ai",
                content:
                    "Chat sudah dibersihkan! 👋 Yuk mulai belajar lagi. Ada yang mau kamu tanyakan?",
                tip: "Tanyakan materi yang sedang kamu pelajari.",
            },
        ])
    }

    return (
        <main className="min-h-screen bg-[#F7F7FB]">
            {/* HEADER */}
            <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6C5CE7] text-white">
                            <Bot size={22} />
                        </div>

                        <div>
                            <h1 className="font-bold text-gray-900">
                                Tanya AI
                            </h1>

                            <div className="flex items-center gap-1.5 text-xs text-green-600">
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                AI siap membantu
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={clearChat}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                        <Trash2 size={16} />

                        <span className="hidden sm:inline">
                            Bersihkan
                        </span>
                    </button>
                </div>
            </header>

            {/* CONTENT */}
            <section className="mx-auto flex min-h-[calc(100vh-64px)] max-w-5xl flex-col px-4 sm:px-6">
                {/* WELCOME */}
                {messages.length === 1 && (
                    <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6C5CE7]/10">
                            <Sparkles
                                size={32}
                                className="text-[#6C5CE7]"
                            />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                            Mau belajar apa hari ini?
                        </h2>

                        <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500">
                            Tanya apa saja tentang materi
                            yang sedang kamu pelajari.
                            AI akan membantu menjelaskan
                            langkah demi langkah.
                        </p>

                        {/* SUGGESTIONS */}
                        <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                            <Suggestion
                                text="Jelaskan apa itu JavaScript"
                                onClick={() =>
                                    setQuestion(
                                        "Jelaskan apa itu JavaScript dengan bahasa yang mudah dipahami"
                                    )
                                }
                            />

                            <Suggestion
                                text="Cara menghitung luas segitiga"
                                onClick={() =>
                                    setQuestion(
                                        "Jelaskan cara menghitung luas segitiga secara rinci"
                                    )
                                }
                            />

                            <Suggestion
                                text="Apa itu database?"
                                onClick={() =>
                                    setQuestion(
                                        "Jelaskan apa itu database dan berikan contoh sederhananya"
                                    )
                                }
                            />

                            <Suggestion
                                text="Buatkan contoh kode React"
                                onClick={() =>
                                    setQuestion(
                                        "Buatkan contoh kode React sederhana dan jelaskan setiap bagiannya"
                                    )
                                }
                            />
                        </div>
                    </div>
                )}

                {/* CHAT */}
                <div
                    className={`flex-1 space-y-6 py-6 ${messages.length === 1
                        ? "hidden"
                        : ""
                        }`}
                >
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-3 ${message.role === "user"
                                ? "justify-end"
                                : "justify-start"
                                }`}
                        >
                            {/* AI ICON */}
                            {message.role === "ai" && (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6C5CE7] text-white">
                                    <Bot size={18} />
                                </div>
                            )}

                            <div className="max-w-[85%] sm:max-w-[75%]">
                                <div
                                    className={`rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${message.role === "user"
                                        ? "rounded-br-md bg-[#6C5CE7] text-white"
                                        : "rounded-bl-md border border-gray-100 bg-white text-gray-700"
                                        }`}
                                >
                                    {message.content
                                        .split("\n")
                                        .map(
                                            (
                                                line,
                                                index
                                            ) => (
                                                <p
                                                    key={
                                                        index
                                                    }
                                                    className={
                                                        index >
                                                            0
                                                            ? "mt-2"
                                                            : ""
                                                    }
                                                >
                                                    {line ||
                                                        "\u00A0"}
                                                </p>
                                            )
                                        )}
                                </div>

                                {/* TIP */}
                                {message.role === "ai" &&
                                    message.tip && (
                                        <div className="mt-2 flex gap-2 rounded-xl border border-yellow-100 bg-yellow-50 px-3 py-2 text-xs leading-5 text-yellow-800">
                                            <Lightbulb
                                                size={15}
                                                className="mt-0.5 shrink-0"
                                            />

                                            <span>
                                                {
                                                    message.tip
                                                }
                                            </span>
                                        </div>
                                    )}
                            </div>

                            {/* USER ICON */}
                            {message.role === "user" && (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-gray-600">
                                    <User size={18} />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* LOADING */}
                    {loading && (
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6C5CE7] text-white">
                                <Bot size={18} />
                            </div>

                            <div className="rounded-2xl rounded-bl-md border border-gray-100 bg-white px-4 py-3 shadow-sm">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />

                                    <span>
                                        AI sedang berpikir...
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* INPUT */}
                <div className="sticky bottom-0 bg-[#F7F7FB] pb-4 pt-2">
                    <form
                        onSubmit={handleSubmit}
                        className="mx-auto max-w-4xl"
                    >
                        <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg shadow-gray-200/40 focus-within:border-[#6C5CE7]">
                            <textarea
                                value={question}
                                onChange={(e) =>
                                    setQuestion(
                                        e.target.value
                                    )
                                }
                                onKeyDown={(e) => {
                                    if (
                                        e.key ===
                                        "Enter" &&
                                        !e.shiftKey
                                    ) {
                                        e.preventDefault()

                                        if (
                                            !loading &&
                                            question.trim()
                                        ) {
                                            handleSubmit()
                                        }
                                    }
                                }}
                                placeholder="Tanyakan sesuatu kepada AI..."
                                rows={1}
                                disabled={loading}
                                className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                            />

                            <button
                                type="submit"
                                disabled={
                                    loading ||
                                    !question.trim()
                                }
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6C5CE7] text-white transition hover:bg-[#5b4bd5] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {loading ? (
                                    <Loader2
                                        size={19}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Send size={19} />
                                )}
                            </button>
                        </div>

                        <p className="mt-2 text-center text-[11px] text-gray-400">
                            Enter untuk mengirim · Shift +
                            Enter untuk baris baru
                        </p>
                    </form>
                </div>
            </section>
        </main>
    )
}

function Suggestion({
    text,
    onClick,
}: {
    text: string
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-xl border border-gray-200 bg-white p-4 text-left text-sm font-medium text-gray-700 transition hover:border-[#6C5CE7]/40 hover:bg-[#6C5CE7]/5 hover:text-[#6C5CE7]"
        >
            {text}
        </button>
    )
}