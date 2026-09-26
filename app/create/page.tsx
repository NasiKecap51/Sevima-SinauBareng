'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    BookOpen,
    Check,
    CircleHelp,
    FileText,
    ListChecks,
    Send,
    PenLine,
    Sparkles,
    ImagePlus,
    X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Category = {
    id: string
    name: string
    slug: string
}

// ==============================
// WARNA
// ==============================

const PALETTE = [
    '#6C5CE7',
    '#FFC857',
    '#FF6B6B',
    '#00B894',
    '#4FA8E0',
]

function colorFor(id: string) {
    let hash = 0

    for (let i = 0; i < id.length; i++) {
        hash =
            id.charCodeAt(i) +
            ((hash << 5) - hash)
    }

    return PALETTE[Math.abs(hash) % PALETTE.length]
}

export default function CreateQuestion() {
    const [categories, setCategories] = useState<Category[]>([])
    const [categoryId, setCategoryId] = useState('')
    const [type, setType] = useState<'mcq' | 'essay'>(
        'essay'
    )

    const [question, setQuestion] = useState('')

    const [options, setOptions] = useState([
        '',
        '',
        '',
        '',
    ])

    const [correctAnswer, setCorrectAnswer] =
        useState('')

    // ==============================
    // IMAGE
    // ==============================

    const [imageFile, setImageFile] =
        useState<File | null>(null)

    const [imagePreview, setImagePreview] =
        useState<string | null>(null)

    const [uploadingImage, setUploadingImage] =
        useState(false)

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const router = useRouter()

    // ==============================
    // LOAD CATEGORY
    // ==============================

    useEffect(() => {
        const loadCategories = async () => {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name')

            if (error) {
                console.error(error)
                return
            }

            setCategories(
                (data as Category[]) ?? []
            )
        }

        loadCategories()
    }, [])

    // ==============================
    // IMAGE SELECT
    // ==============================

    const handleImageChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0]

        if (!file) return

        setError('')

        // Maksimal 5 MB
        if (file.size > 5 * 1024 * 1024) {
            setError(
                'Ukuran gambar maksimal 5 MB.'
            )

            e.target.value = ''
            return
        }

        // Hanya gambar
        if (!file.type.startsWith('image/')) {
            setError(
                'File yang dipilih harus berupa gambar.'
            )

            e.target.value = ''
            return
        }

        setImageFile(file)

        const previewUrl =
            URL.createObjectURL(file)

        setImagePreview(previewUrl)
    }

    // ==============================
    // REMOVE IMAGE
    // ==============================

    const removeImage = () => {
        setImageFile(null)
        setImagePreview(null)
    }

    // ==============================
    // SUBMIT
    // ==============================

    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault()
        setError('')

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            setError(
                'Kamu harus login dulu.'
            )

            return
        }

        if (!categoryId) {
            setError(
                'Pilih kategori terlebih dahulu.'
            )

            return
        }

        if (!question.trim()) {
            setError(
                'Pertanyaan tidak boleh kosong.'
            )

            return
        }

        if (
            type === 'mcq' &&
            options.some(
                (o) => !o.trim()
            )
        ) {
            setError(
                'Isi semua pilihan jawaban.'
            )

            return
        }

        if (
            type === 'mcq' &&
            !correctAnswer
        ) {
            setError(
                'Pilih jawaban yang benar.'
            )

            return
        }

        setLoading(true)

        try {
            // ==============================
            // UPLOAD IMAGE
            // ==============================

            let imageUrl: string | null = null

            if (imageFile) {
                setUploadingImage(true)

                const fileExt =
                    imageFile.name
                        .split('.')
                        .pop()
                        ?.toLowerCase() || 'jpg'

                const fileName =
                    `${user.id}-${Date.now()}.${fileExt}`

                const filePath =
                    `${user.id}/${fileName}`

                const {
                    error: uploadError,
                } = await supabase.storage
                    .from('question-images')
                    .upload(
                        filePath,
                        imageFile,
                        {
                            cacheControl:
                                '3600',
                            upsert: false,
                        }
                    )

                if (uploadError) {
                    throw uploadError
                }

                const {
                    data: publicUrlData,
                } = supabase.storage
                    .from(
                        'question-images'
                    )
                    .getPublicUrl(filePath)

                imageUrl =
                    publicUrlData.publicUrl

                setUploadingImage(false)
            }

            // ==============================
            // INSERT QUESTION
            // ==============================

            const {
                error: insertError,
            } = await supabase
                .from('questions')
                .insert({
                    user_id: user.id,
                    category_id: categoryId,
                    type,
                    question:
                        question.trim(),

                    options:
                        type === 'mcq'
                            ? options
                            : null,

                    correct_answer:
                        type === 'mcq'
                            ? correctAnswer
                            : null,

                    image_url: imageUrl,
                })

            if (insertError) {
                throw insertError
            }

            router.push('/progress')
        } catch (error: any) {
            console.error(error)

            setUploadingImage(false)

            setError(
                error?.message ||
                'Gagal mengirim soal.'
            )
        } finally {
            setLoading(false)
        }
    }

    // ==============================
    // ACCENT COLOR
    // ==============================

    const accent = categoryId
        ? colorFor(categoryId)
        : '#6C5CE7'

    return (
        <main className="min-h-screen bg-white px-3 py-5 sm:px-6 lg:px-8">

            <div className="mx-auto w-full max-w-3xl">

                {/* ==============================
                    HEADER
                ============================== */}

                <div className="mb-6">

                    <div className="flex items-center gap-3">

                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm"
                            style={{
                                backgroundColor:
                                    '#6C5CE7',
                            }}
                        >
                            <PenLine size={23} />
                        </div>

                        <div>

                            <h1 className="text-xl font-bold text-[#1A1A2E] sm:text-2xl">
                                Tulis Soal
                            </h1>

                            <p className="text-sm text-[#6B6B80]">
                                Bagikan soal dan belajar
                                bareng komunitas.
                            </p>

                        </div>

                    </div>

                </div>

                {/* ==============================
                    FORM
                ============================== */}

                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-[#E8E8F0] bg-white p-4 shadow-sm sm:p-6"
                >

                    {/* ==============================
                        KATEGORI
                    ============================== */}

                    <section className="mb-7">

                        <div className="mb-3 flex items-center gap-2">

                            <BookOpen
                                size={18}
                                className="text-[#6B6B80]"
                            />

                            <label className="text-sm font-semibold text-[#1A1A2E]">
                                Kategori
                            </label>

                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">

                            {categories.map(
                                (category) => {

                                    const color =
                                        colorFor(
                                            category.id
                                        )

                                    const active =
                                        categoryId ===
                                        category.id

                                    return (
                                        <button
                                            key={
                                                category.id
                                            }
                                            type="button"
                                            onClick={() =>
                                                setCategoryId(
                                                    category.id
                                                )
                                            }
                                            className="flex min-h-[46px] items-center gap-2 rounded-xl border px-3 text-left text-sm font-medium transition-all hover:-translate-y-[1px]"
                                            style={
                                                active
                                                    ? {
                                                        backgroundColor:
                                                            color,
                                                        borderColor:
                                                            color,
                                                        color:
                                                            '#FFFFFF',
                                                        boxShadow:
                                                            `0 4px 12px ${color}35`,
                                                    }
                                                    : {
                                                        backgroundColor:
                                                            '#FFFFFF',
                                                        borderColor:
                                                            '#E8E8F0',
                                                        color:
                                                            '#6B6B80',
                                                    }
                                            }
                                        >

                                            <span
                                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                                                style={{
                                                    backgroundColor:
                                                        active
                                                            ? 'rgba(255,255,255,0.25)'
                                                            : `${color}18`,
                                                    color:
                                                        active
                                                            ? '#FFFFFF'
                                                            : color,
                                                }}
                                            >
                                                {category.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </span>

                                            <span className="truncate">
                                                {
                                                    category.name
                                                }
                                            </span>

                                            {active && (
                                                <Check
                                                    size={16}
                                                    className="ml-auto shrink-0"
                                                />
                                            )}

                                        </button>
                                    )
                                }
                            )}

                        </div>

                    </section>

                    {/* ==============================
                        TIPE SOAL
                    ============================== */}

                    <section className="mb-7">

                        <div className="mb-3 flex items-center gap-2">

                            <ListChecks
                                size={18}
                                className="text-[#6B6B80]"
                            />

                            <label className="text-sm font-semibold text-[#1A1A2E]">
                                Tipe Soal
                            </label>

                        </div>

                        <div className="grid grid-cols-2 gap-3">

                            {/* ESAI */}

                            <button
                                type="button"
                                onClick={() => {
                                    setType(
                                        'essay'
                                    )
                                    setCorrectAnswer(
                                        ''
                                    )
                                }}
                                className="flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-all"
                                style={
                                    type ===
                                        'essay'
                                        ? {
                                            backgroundColor:
                                                '#6C5CE7',
                                            borderColor:
                                                '#6C5CE7',
                                            color:
                                                '#FFFFFF',
                                            boxShadow:
                                                '0 4px 12px rgba(108,92,231,0.20)',
                                        }
                                        : {
                                            backgroundColor:
                                                '#FFFFFF',
                                            borderColor:
                                                '#E8E8F0',
                                            color:
                                                '#555A6D',
                                        }
                                }
                            >

                                <FileText
                                    size={18}
                                />

                                Esai

                            </button>

                            {/* PILIHAN GANDA */}

                            <button
                                type="button"
                                onClick={() =>
                                    setType(
                                        'mcq'
                                    )
                                }
                                className="flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-all"
                                style={
                                    type ===
                                        'mcq'
                                        ? {
                                            backgroundColor:
                                                '#6C5CE7',
                                            borderColor:
                                                '#6C5CE7',
                                            color:
                                                '#FFFFFF',
                                            boxShadow:
                                                '0 4px 12px rgba(108,92,231,0.20)',
                                        }
                                        : {
                                            backgroundColor:
                                                '#FFFFFF',
                                            borderColor:
                                                '#E8E8F0',
                                            color:
                                                '#555A6D',
                                        }
                                }
                            >

                                <ListChecks
                                    size={18}
                                />

                                Pilihan Ganda

                            </button>

                        </div>

                    </section>

                    {/* ==============================
                        PERTANYAAN
                    ============================== */}

                    <section className="mb-7">

                        <div className="mb-3 flex items-center gap-2">

                            <CircleHelp
                                size={18}
                                className="text-[#6B6B80]"
                            />

                            <label
                                htmlFor="question"
                                className="text-sm font-semibold text-[#1A1A2E]"
                            >
                                Pertanyaan
                            </label>

                        </div>

                        <textarea
                            id="question"
                            value={question}
                            onChange={(e) =>
                                setQuestion(
                                    e.target.value
                                )
                            }
                            placeholder="Tulis pertanyaanmu di sini..."
                            className="min-h-[140px] w-full resize-y rounded-xl border border-[#E8E8F0] bg-white p-4 text-sm text-[#1A1A2E] outline-none transition placeholder:text-[#9A9EAE]"
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor =
                                    '#6C5CE7'

                                e.currentTarget.style.boxShadow =
                                    '0 0 0 3px rgba(108,92,231,0.12)'
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor =
                                    '#E8E8F0'

                                e.currentTarget.style.boxShadow =
                                    'none'
                            }}
                            required
                        />

                    </section>

                    {/* ==============================
                        GAMBAR
                    ============================== */}

                    <section className="mb-7">

                        <div className="mb-3 flex items-center gap-2">

                            <ImagePlus
                                size={18}
                                className="text-[#6B6B80]"
                            />

                            <label className="text-sm font-semibold text-[#1A1A2E]">
                                Gambar Soal
                            </label>

                            <span className="text-xs text-[#9A9EAE]">
                                (opsional)
                            </span>

                        </div>

                        {!imagePreview ? (

                            <label
                                htmlFor="question-image"
                                className="flex min-h-[130px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E8E8F0] bg-[#FAFAFC] px-4 text-center transition hover:border-[#6C5CE7] hover:bg-[#F8F7FF]"
                            >

                                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EFFF] text-[#6C5CE7]">
                                    <ImagePlus
                                        size={22}
                                    />
                                </div>

                                <p className="text-sm font-semibold text-[#555A6D]">
                                    Klik untuk memilih gambar
                                </p>

                                <p className="mt-1 text-xs text-[#9A9EAE]">
                                    PNG, JPG, JPEG atau WEBP • Maks. 5 MB
                                </p>

                                <input
                                    id="question-image"
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    onChange={
                                        handleImageChange
                                    }
                                    className="hidden"
                                />

                            </label>

                        ) : (

                            <div className="relative overflow-hidden rounded-xl border border-[#E8E8F0] bg-[#FAFAFC]">

                                <img
                                    src={imagePreview}
                                    alt="Preview gambar soal"
                                    className="max-h-[350px] w-full object-contain"
                                />

                                <button
                                    type="button"
                                    onClick={
                                        removeImage
                                    }
                                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-red-500"
                                    title="Hapus gambar"
                                >

                                    <X size={18} />

                                </button>

                            </div>

                        )}

                    </section>

                    {/* ==============================
                        PILIHAN GANDA
                    ============================== */}

                    {type === 'mcq' && (

                        <section className="mb-7">

                            <div className="mb-3 flex items-center gap-2">

                                <ListChecks
                                    size={18}
                                    className="text-[#6B6B80]"
                                />

                                <label className="text-sm font-semibold text-[#1A1A2E]">
                                    Pilihan Jawaban
                                </label>

                            </div>

                            <div className="flex flex-col gap-3">

                                {options.map(
                                    (
                                        option,
                                        index
                                    ) => {

                                        const letter =
                                            String.fromCharCode(
                                                65 +
                                                index
                                            )

                                        const isCorrect =
                                            correctAnswer ===
                                            option &&
                                            option !== ''

                                        return (

                                            <div
                                                key={
                                                    index
                                                }
                                                className="flex items-center gap-3"
                                            >

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (
                                                            option.trim()
                                                        ) {
                                                            setCorrectAnswer(
                                                                option
                                                            )
                                                        }
                                                    }}
                                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition"
                                                    style={{
                                                        backgroundColor:
                                                            isCorrect
                                                                ? '#6C5CE7'
                                                                : '#F4F4FA',

                                                        borderColor:
                                                            isCorrect
                                                                ? '#6C5CE7'
                                                                : '#E8E8F0',

                                                        color:
                                                            isCorrect
                                                                ? '#FFFFFF'
                                                                : '#6C5CE7',
                                                    }}
                                                >

                                                    {isCorrect ? (
                                                        <Check
                                                            size={
                                                                17
                                                            }
                                                        />
                                                    ) : (
                                                        letter
                                                    )}

                                                </button>

                                                <input
                                                    type="text"
                                                    value={
                                                        option
                                                    }
                                                    placeholder={`Pilihan ${letter}`}
                                                    onChange={(
                                                        e
                                                    ) => {

                                                        const next =
                                                            [
                                                                ...options,
                                                            ]

                                                        const previousValue =
                                                            next[
                                                            index
                                                            ]

                                                        next[
                                                            index
                                                        ] =
                                                            e
                                                                .target
                                                                .value

                                                        setOptions(
                                                            next
                                                        )

                                                        if (
                                                            correctAnswer ===
                                                            previousValue
                                                        ) {
                                                            setCorrectAnswer(
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }

                                                    }}
                                                    className="h-11 flex-1 rounded-xl border border-[#E8E8F0] bg-white px-3 text-sm text-[#1A1A2E] outline-none transition placeholder:text-[#9A9EAE]"
                                                    onFocus={(
                                                        e
                                                    ) => {

                                                        e.currentTarget.style.borderColor =
                                                            '#6C5CE7'

                                                        e.currentTarget.style.boxShadow =
                                                            '0 0 0 3px rgba(108,92,231,0.12)'

                                                    }}
                                                    onBlur={(
                                                        e
                                                    ) => {

                                                        e.currentTarget.style.borderColor =
                                                            '#E8E8F0'

                                                        e.currentTarget.style.boxShadow =
                                                            'none'

                                                    }}
                                                />

                                            </div>

                                        )
                                    }
                                )}

                            </div>

                            <div
                                className="mt-3 flex items-center gap-2 rounded-xl p-3 text-xs"
                                style={{
                                    backgroundColor:
                                        '#F4F2FF',
                                    color:
                                        '#6B6B80',
                                }}
                            >

                                <Sparkles
                                    size={15}
                                    className="shrink-0"
                                    style={{
                                        color:
                                            '#6C5CE7',
                                    }}
                                />

                                <span>
                                    Klik huruf di
                                    sebelah kiri
                                    untuk menandai
                                    jawaban yang
                                    benar.
                                </span>

                            </div>

                        </section>

                    )}

                    {/* ==============================
                        ERROR
                    ============================== */}

                    {error && (

                        <div
                            className="mb-5 rounded-xl border p-3 text-sm"
                            style={{
                                borderColor:
                                    '#FFB8B8',
                                backgroundColor:
                                    '#FFF2F2',
                                color:
                                    '#E54848',
                            }}
                        >

                            {error}

                        </div>

                    )}

                    {/* ==============================
                        SUBMIT
                    ============================== */}

                    <button
                        type="submit"
                        disabled={
                            loading ||
                            uploadingImage
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl p-3.5 text-sm font-bold text-white transition-all hover:-translate-y-[1px] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                            backgroundColor:
                                '#6C5CE7',
                        }}
                    >

                        <Send size={18} />

                        {uploadingImage
                            ? 'Mengupload gambar...'
                            : loading
                                ? 'Mengirim soal...'
                                : 'Tempel ke Papan'}

                    </button>

                </form>

                {/* ==============================
                    INFO
                ============================== */}

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#8A8F9F]">

                    <CircleHelp size={14} />

                    <span>
                        Pilih kategori, tipe soal,
                        dan gambar jika diperlukan.
                    </span>

                </div>

            </div>

        </main>
    )
}