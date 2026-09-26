'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Category = { id: string; name: string; slug: string }

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
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        Bikin Pertanyaan
      </h1>
      <p className="text-[#6B6B80] mb-8">Bagikan soal buat dijawab bareng-bareng.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-[#1A1A2E] mb-1 block">Kategori</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-[#ECECF4] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]"
          >
            <option value="">Pilih kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-[#1A1A2E] mb-1 block">Tipe Soal</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('essay')}
              className={`flex-1 rounded-xl p-3 font-medium border ${type === 'essay' ? 'bg-[#6C5CE7] text-white border-[#6C5CE7]' : 'border-[#ECECF4] text-[#1A1A2E]'
                }`}
            >
              Esai
            </button>
            <button
              type="button"
              onClick={() => setType('mcq')}
              className={`flex-1 rounded-xl p-3 font-medium border ${type === 'mcq' ? 'bg-[#6C5CE7] text-white border-[#6C5CE7]' : 'border-[#ECECF4] text-[#1A1A2E]'
                }`}
            >
              Pilihan Ganda
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-[#1A1A2E] mb-1 block">Pertanyaan</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Tulis pertanyaanmu..."
            className="w-full border border-[#ECECF4] rounded-xl p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]"
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
                  className="accent-[#6C5CE7]"
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
                  className="flex-1 border border-[#ECECF4] rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]"
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
          className="bg-[#6C5CE7] hover:bg-[#5849c2] text-white rounded-xl p-3 font-medium transition disabled:opacity-60"
        >
          {loading ? 'Menyimpan...' : 'Posting Pertanyaan'}
        </button>
      </form>
    </main>
  )
}