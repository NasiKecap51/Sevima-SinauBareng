'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Category = { id: string; name: string; slug: string }

const PALETTE = ['#6C5CE7', '#FF6B6B', '#00B894', '#E8A400', '#4FA8E0', '#F06595']

function colorFor(id: string) {
    let hash = 0
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
    return PALETTE[Math.abs(hash) % PALETTE.length]
}

export default function CreateQuestion() {
    const [categories, setCategories] = useState<Category[]>([])
    const [categoryId, setCategoryId] = useState('')
    const [type, setType] = useState<'mcq' | 'essay'>('essay')
    const [question, setQuestion] = useState('')
    const [options, setOptions] = useState(['', '', '', ''])
    const [correctAnswer, setCorrectAnswer] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const loadCategories = async () => {
            const { data } = await supabase.from('categories').select('*').order('name')
            setCategories((data as Category[]) ?? [])
        }
        loadCategories()
    }, [])

    const accent = categoryId ? colorFor(categoryId) : '#1A1A2E'

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setError('Kamu harus login dulu.')
            return
        }
        if (!categoryId) {
            setError('Pilih kategori dulu.')
            return
        }
        if (type === 'mcq' && options.some((o) => !o.trim())) {
            setError('Isi semua pilihan jawaban.')
            return
        }
        if (type === 'mcq' && !correctAnswer) {
            setError('Pilih jawaban yang benar.')
            return
        }

        setLoading(true)

        const { error: insertError } = await supabase.from('questions').insert({
            user_id: user.id,
            category_id: categoryId,
            type,
            question,
            options: type === 'mcq' ? options : null,
            correct_answer: type === 'mcq' ? correctAnswer : null,
        })

        if (insertError) {
            setError(insertError.message)
            setLoading(false)
        } else {
            router.push('/progress')
        }
    }

    return (
        <main className="max-w-xl mx-auto p-4 sm:p-6 pb-20 sm:pb-10">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Tempel Soal Baru
            </h1>
            <p className="text-[#6B6B80] mb-8 text-sm sm:text-base">Satu pertanyaan bisa jadi diskusi banyak orang.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                    <label className="text-sm font-medium text-[#1A1A2E] mb-2 block">Kategori</label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((c) => {
                            const color = colorFor(c.id)
                            const active = categoryId === c.id
                            return (
                                <button
                                    type="button"
                                    key={c.id}
                                    onClick={() => setCategoryId(c.id)}
                                    className="text-sm font-medium px-3.5 py-1.5 rounded-full border transition"
                                    style={
                                        active
                                            ? { backgroundColor: color, borderColor: color, color: '#fff' }
                                            : { borderColor: '#ECECF4', color: '#6B6B80' }
                                    }
                                >
                                    {c.name}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-[#1A1A2E] mb-2 block">Tipe Soal</label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setType('essay')}
                            className="flex-1 rounded-xl p-3 text-sm sm:text-base font-medium border transition"
                            style={
                                type === 'essay'
                                    ? { backgroundColor: accent, borderColor: accent, color: '#fff' }
                                    : { borderColor: '#ECECF4', color: '#1A1A2E' }
                            }
                        >
                            Esai
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('mcq')}
                            className="flex-1 rounded-xl p-3 text-sm sm:text-base font-medium border transition"
                            style={
                                type === 'mcq'
                                    ? { backgroundColor: accent, borderColor: accent, color: '#fff' }
                                    : { borderColor: '#ECECF4', color: '#1A1A2E' }
                            }
                        >
                            Pilihan Ganda
                        </button>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-[#1A1A2E] mb-2 block">Pertanyaan</label>
                    <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Tulis pertanyaanmu di sini..."
                        className="w-full border border-[#ECECF4] rounded-xl p-3 text-sm sm:text-base min-h-[110px] focus:outline-none transition"
                        onFocus={(e) => (e.target.style.borderColor = accent)}
                        onBlur={(e) => (e.target.style.borderColor = '#ECECF4')}
                        required
                    />
                </div>

                {type === 'mcq' && (
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#1A1A2E]">Pilihan Jawaban</label>
                        {options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="correct"
                                    checked={correctAnswer === opt && opt !== ''}
                                    onChange={() => setCorrectAnswer(opt)}
                                    className="shrink-0"
                                    style={{ accentColor: accent }}
                                />
                                <input
                                    type="text"
                                    placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                                    value={opt}
                                    onChange={(e) => {
                                        const next = [...options]
                                        const prevVal = next[i]
                                        next[i] = e.target.value
                                        setOptions(next)
                                        if (correctAnswer === prevVal) setCorrectAnswer(e.target.value)
                                    }}
                                    className="flex-1 border border-[#ECECF4] rounded-xl p-2 text-sm sm:text-base focus:outline-none"
                                />
                            </div>
                        ))}
                        <p className="text-xs text-[#6B6B80]">Klik bulatan di samping pilihan buat tandain jawaban benar.</p>
                    </div>
                )}

                {error && <p className="text-[#FF6B6B] text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="text-white rounded-full p-3 font-medium transition disabled:opacity-50"
                    style={{ backgroundColor: accent }}
                >
                    {loading ? 'Menempel...' : 'Tempel ke Papan'}
                </button>
            </form>
        </main>
    )
}