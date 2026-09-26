'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Category = { id: string; name: string; slug: string }

type Question = {
    id: string
    user_id: string
    category_id: string | null
    type: 'mcq' | 'essay'
    question: string
    options: string[] | null
    correct_answer: string | null
    created_at: string
}

type Answer = {
    id: string
    question_id: string
    user_id: string
    answer_text: string
    score: number | null
    feedback: string | null
    created_at: string
}

const PALETTE = ['#6C5CE7', '#FF6B6B', '#00B894', '#E8A400', '#4FA8E0', '#F06595']

function colorFor(id: string) {
    let hash = 0
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
    return PALETTE[Math.abs(hash) % PALETTE.length]
}

function initialFor(name?: string) {
    return (name?.trim()?.[0] ?? '?').toUpperCase()
}

function timeAgo(iso: string) {
    const diffMs = Date.now() - new Date(iso).getTime()
    const min = Math.floor(diffMs / 60000)
    if (min < 1) return 'baru saja'
    if (min < 60) return `${min}m lalu`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr}j lalu`
    const day = Math.floor(hr / 24)
    if (day < 7) return `${day}h lalu`
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export default function Progress() {
    const [categories, setCategories] = useState<Category[]>([])
    const [activeCategory, setActiveCategory] = useState<string>('all')
    const [questions, setQuestions] = useState<Question[]>([])
    const [answersByQuestion, setAnswersByQuestion] = useState<Record<string, Answer[]>>({})
    const [nicknames, setNicknames] = useState<Record<string, string>>({})
    const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({})
    const [userId, setUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState<string | null>(null)
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})
    const [submitError, setSubmitError] = useState<Record<string, string>>({})
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUserId(user?.id ?? null)

            const { data: catData } = await supabase.from('categories').select('*').order('name')
            setCategories((catData as Category[]) ?? [])

            const { data: qData, error: qError } = await supabase
                .from('questions')
                .select('*')
                .order('created_at', { ascending: false })

            if (qError) {
                console.error('Fetch questions error:', qError)
                setLoading(false)
                return
            }

            const qs = (qData as Question[]) ?? []
            setQuestions(qs)

            const { data: aData, error: aError } = await supabase
                .from('answers')
                .select('*')
                .order('created_at', { ascending: true })

            if (aError) {
                console.error('Fetch answers error:', aError)
            } else {
                const grouped: Record<string, Answer[]> = {}
                    ; (aData as Answer[]).forEach((a) => {
                        if (!grouped[a.question_id]) grouped[a.question_id] = []
                        grouped[a.question_id].push(a)
                    })
                setAnswersByQuestion(grouped)

                const userIds = Array.from(new Set((aData as Answer[]).map((a) => a.user_id)))
                if (userIds.length > 0) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('id, nickname')
                        .in('id', userIds)
                    const nickMap: Record<string, string> = {}
                        ; (profileData as { id: string; nickname: string }[] ?? []).forEach((p) => {
                            nickMap[p.id] = p.nickname
                        })
                    setNicknames(nickMap)
                }
            }

            setLoading(false)
        }
        load()
    }, [])

    const handleSubmit = async (questionId: string) => {
        if (!userId) return
        const text = draftAnswers[questionId]?.trim()
        if (!text) return

        setSubmitting(questionId)
        setSubmitError((prev) => ({ ...prev, [questionId]: '' }))

        const { data, error } = await supabase
            .from('answers')
            .insert({ question_id: questionId, user_id: userId, answer_text: text })
            .select()
            .single()

        if (error) {
            console.error('Submit error:', error)
            setSubmitError((prev) => ({
                ...prev,
                [questionId]: error.message || 'Gagal mengirim jawaban. Coba lagi.',
            }))
        } else {
            setAnswersByQuestion((prev) => ({
                ...prev,
                [questionId]: [...(prev[questionId] ?? []), data as Answer],
            }))
            setDraftAnswers((prev) => ({ ...prev, [questionId]: '' }))
            setExpanded((prev) => ({ ...prev, [questionId]: true }))
        }
        setSubmitting(null)
    }

    const filteredQuestions = questions.filter((q) => {
        const matchesCategory = activeCategory === 'all' || q.category_id === activeCategory
        const matchesSearch = searchQuery.trim() === '' || q.question.toLowerCase().includes(searchQuery.trim().toLowerCase())
        return matchesCategory && matchesSearch
    })

    return (
        <main className="min-h-screen bg-[#F1F3F5]">
            {/* mobile overlay behind the drawer */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black/30 z-30 sm:hidden"
                />
            )}

            {/* row: sidebar + content, with a real gap between them on desktop */}
            <div className="sm:flex sm:items-start sm:gap-6 sm:px-4 sm:pt-4">
                {/* sidebar — its own floating panel, detached from the content column */}
                <aside
                    className={`fixed sm:sticky top-0 sm:top-4 left-0 h-screen sm:h-[calc(100vh-2rem)] w-72 shrink-0 bg-white border border-[#E4E7EC] sm:rounded-2xl sm:shadow-sm flex flex-col z-40 transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        } sm:translate-x-0`}
                >
                    <div className="p-4 border-b border-[#E4E7EC]">
                        <div className="flex items-center justify-between mb-3">
                            <h1 className="text-xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>

                            </h1>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                aria-label="Tutup menu"
                                className="sm:hidden w-7 h-7 flex items-center justify-center rounded-full text-[#6B6B80] hover:bg-[#F1F3F5]"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6] text-sm">🔍</span>
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari soal..."
                                className="w-full bg-[#F1F3F5] rounded-full pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#FF4500]"
                            />
                        </div>
                    </div>

                    <nav className="flex-1 overflow-y-auto p-2">
                        <Link
                            href="/create"
                            className="flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-[#FF4500] hover:bg-[#e63e00] transition rounded-full py-2 mx-1 mb-3"
                        >
                            + Tulis Soal
                        </Link>

                        <button
                            onClick={() => { setActiveCategory('all'); setSidebarOpen(false) }}
                            className="w-full flex items-center gap-2.5 text-sm font-medium px-3 py-2 rounded-full transition mb-1"
                            style={
                                activeCategory === 'all'
                                    ? { backgroundColor: '#F1F3F5', color: '#1A1A2E' }
                                    : { color: '#6B6B80' }
                            }
                        >
                            <span className="text-base">🏠</span>
                            Semua
                        </button>

                        <p className="px-3 mt-4 mb-1 text-[11px] font-semibold text-[#9AA0A6] tracking-wide">
                            KATEGORI
                        </p>
                        {categories.map((c) => {
                            const color = colorFor(c.id)
                            const active = activeCategory === c.id
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => { setActiveCategory(c.id); setSidebarOpen(false) }}
                                    className="w-full flex items-center gap-2.5 text-sm font-medium px-3 py-2 rounded-full transition mb-1"
                                    style={
                                        active
                                            ? { backgroundColor: '#F1F3F5', color: '#1A1A2E' }
                                            : { color: '#6B6B80' }
                                    }
                                >
                                    <span
                                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                        style={{ backgroundColor: color }}
                                    >
                                        {initialFor(c.name)}
                                    </span>
                                    {c.name}
                                </button>
                            )
                        })}
                    </nav>
                </aside>

                {/* mobile top bar */}
                <div className="sm:hidden fixed top-0 inset-x-0 h-12 bg-white border-b border-[#E4E7EC] flex items-center gap-3 px-3 z-20">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Buka menu"
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F1F3F5]"
                    >
                        ☰
                    </button>
                    <span className="font-bold text-[#1A1A2E]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        Papan Sinau
                    </span>
                </div>

                {/* main content — its own column, no longer flush against the sidebar */}
                <div className="flex-1 min-w-0">
                    <div className="max-w-2xl mx-auto px-3 sm:px-0 pt-16 sm:pt-0 pb-24 sm:pb-10">
                        {loading ? (
                            <div className="flex flex-col gap-3">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="bg-white border border-[#E4E7EC] rounded-md h-28 animate-pulse" />
                                ))}
                            </div>
                        ) : filteredQuestions.length === 0 ? (
                            <div className="bg-white border border-dashed border-[#E4E7EC] rounded-md p-10 text-center">
                                <p className="text-[#6B6B80]">Papan masih kosong di kategori ini.</p>
                                <Link href="/create" className="text-[#FF4500] font-semibold text-sm">Jadi yang pertama nempel soal →</Link>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {filteredQuestions.map((q) => {
                                    const answers = answersByQuestion[q.id] ?? []
                                    const category = categories.find((c) => c.id === q.category_id)
                                    const accent = colorFor(q.category_id ?? q.id)
                                    const isOpen = expanded[q.id]
                                    const error = submitError[q.id]

                                    return (
                                        <div key={q.id} className="bg-white border border-[#E4E7EC] rounded-md hover:border-[#D5D9DE] transition">
                                            <div className="p-3 sm:p-4">
                                                <div className="flex items-center gap-1.5 text-xs text-[#6B6B80] mb-1.5 flex-wrap">
                                                    <span
                                                        className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                                                        style={{ backgroundColor: accent }}
                                                    >
                                                        {initialFor(category?.name)}
                                                    </span>
                                                    <span className="font-medium text-[#1A1A2E]">{category?.name ?? 'Umum'}</span>
                                                    <span>•</span>
                                                    <span>{q.type === 'mcq' ? 'Pilihan Ganda' : 'Esai'}</span>
                                                    <span>•</span>
                                                    <span>{timeAgo(q.created_at)}</span>
                                                </div>

                                                <p className="text-[#1A1A2E] mb-3 text-sm sm:text-[15px] leading-relaxed font-medium">
                                                    {q.question}
                                                </p>

                                                {q.type === 'mcq' && q.options && (
                                                    <div className="flex flex-col gap-1.5 mb-3">
                                                        {q.options.map((opt, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => setDraftAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                                                                className="text-left border rounded-md px-3 py-2 text-sm transition"
                                                                style={
                                                                    draftAnswers[q.id] === opt
                                                                        ? { borderColor: accent, backgroundColor: `${accent}12` }
                                                                        : { borderColor: '#E4E7EC' }
                                                                }
                                                            >
                                                                {opt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {q.type === 'essay' && (
                                                    <textarea
                                                        placeholder="Tulis jawabanmu..."
                                                        value={draftAnswers[q.id] ?? ''}
                                                        onChange={(e) => setDraftAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                                        className="w-full border rounded-md p-2.5 text-sm min-h-[72px] mb-2 focus:outline-none focus:ring-1"
                                                        style={{
                                                            borderColor: draftAnswers[q.id] ? accent : '#E4E7EC',
                                                        }}
                                                    />
                                                )}

                                                {error && (
                                                    <p className="text-xs text-[#E0245E] mb-2">{error}</p>
                                                )}
                                                {!userId && (
                                                    <p className="text-xs text-[#6B6B80] mb-2">Masuk dulu untuk bisa menjawab.</p>
                                                )}

                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <button
                                                        onClick={() => handleSubmit(q.id)}
                                                        disabled={!draftAnswers[q.id]?.trim() || submitting === q.id || !userId}
                                                        className="text-white rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold disabled:opacity-40 transition"
                                                        style={{ backgroundColor: accent }}
                                                    >
                                                        {submitting === q.id ? 'Mengirim...' : 'Kirim Jawaban'}
                                                    </button>

                                                    {answers.length > 0 && (
                                                        <button
                                                            onClick={() => setExpanded((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                                                            className="flex items-center gap-1 text-xs font-semibold text-[#6B6B80] hover:text-[#1A1A2E] transition"
                                                        >
                                                            💬 {answers.length} jawaban
                                                        </button>
                                                    )}
                                                </div>

                                                {isOpen && answers.length > 0 && (
                                                    <div className="flex flex-col gap-3 mt-3 pl-3 border-l-2 border-[#EDEFF1]">
                                                        {answers.map((a) => (
                                                            <div key={a.id} className="flex gap-2">
                                                                <span
                                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                                                                    style={{ backgroundColor: colorFor(a.user_id) }}
                                                                >
                                                                    {initialFor(nicknames[a.user_id])}
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-semibold text-[#1A1A2E]">
                                                                        {nicknames[a.user_id] ?? 'Pengguna'}
                                                                        <span className="font-normal text-[#6B6B80]"> · {timeAgo(a.created_at)}</span>
                                                                    </p>
                                                                    <p className="text-sm text-[#1A1A2E]">{a.answer_text}</p>
                                                                    {a.feedback && (
                                                                        <p className="text-xs text-[#00B894] mt-1">{a.feedback}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}