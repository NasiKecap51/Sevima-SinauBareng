'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Plus,
    Home,
    Menu,
    Send,
    MessageCircle,
    Trash2,
    Bot,
    Sparkles,
    Clock3,
    BookOpen,
    CheckCircle2,
    FileText,
    ChevronDown,
    ChevronUp,
    Image as ImageIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Category = {
    id: string
    name: string
    slug: string
}

type Question = {
    id: string
    user_id: string
    category_id: string | null
    type: 'mcq' | 'essay'
    question: string
    options: string[] | null
    correct_answer: string | null
    image_url: string | null
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

type Comment = {
    id: string
    answer_id: string
    user_id: string
    comment_text: string
    created_at: string
}

const colorFor = (index: number) => {
    const colors = [
        'bg-blue-100 text-blue-600',
        'bg-purple-100 text-purple-600',
        'bg-green-100 text-green-600',
        'bg-orange-100 text-orange-600',
        'bg-pink-100 text-pink-600',
        'bg-cyan-100 text-cyan-600',
    ]

    return colors[index % colors.length]
}

const initialFor = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || '?'
}

const timeAgo = (date: string) => {
    const now = new Date().getTime()
    const past = new Date(date).getTime()
    const diff = Math.floor((now - past) / 1000)

    if (diff < 60) return 'baru saja'

    const minutes = Math.floor(diff / 60)

    if (minutes < 60) {
        return `${minutes} menit lalu`
    }

    const hours = Math.floor(minutes / 60)

    if (hours < 24) {
        return `${hours} jam lalu`
    }

    const days = Math.floor(hours / 24)

    if (days < 30) {
        return `${days} hari lalu`
    }

    const months = Math.floor(days / 30)

    if (months < 12) {
        return `${months} bulan lalu`
    }

    return `${Math.floor(months / 12)} tahun lalu`
}

const scoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400'

    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'

    return 'text-red-600'
}

export default function ProgressPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [activeCategory, setActiveCategory] = useState('all')

    const [questions, setQuestions] = useState<Question[]>([])

    const [answersByQuestion, setAnswersByQuestion] =
        useState<Record<string, Answer[]>>({})

    const [commentsByAnswer, setCommentsByAnswer] =
        useState<Record<string, Comment[]>>({})

    const [nicknames, setNicknames] =
        useState<Record<string, string>>({})

    const [draftAnswers, setDraftAnswers] =
        useState<Record<string, string>>({})

    const [commentDrafts, setCommentDrafts] =
        useState<Record<string, string>>({})

    const [userId, setUserId] = useState<string | null>(null)

    const [loading, setLoading] = useState(true)

    const [submitting, setSubmitting] =
        useState<string | null>(null)

    const [commenting, setCommenting] =
        useState<string | null>(null)

    const [deleting, setDeleting] =
        useState<string | null>(null)

    const [answerOpen, setAnswerOpen] =
        useState<Record<string, boolean>>({})

    const [discussionOpen, setDiscussionOpen] =
        useState<Record<string, boolean>>({})

    const [commentOpen, setCommentOpen] =
        useState<Record<string, boolean>>({})

    const [submitError, setSubmitError] =
        useState<Record<string, string>>({})

    const [commentError, setCommentError] =
        useState<Record<string, string>>({})

    const [sidebarOpen, setSidebarOpen] =
        useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (user) {
                setUserId(user.id)
            }

            // =========================
            // CATEGORIES
            // =========================

            const {
                data: categoryData,
                error: categoryError,
            } = await supabase
                .from('categories')
                .select('id, name, slug')
                .order('name')

            if (categoryError) {
                console.error(categoryError)
            } else {
                setCategories(categoryData || [])
            }

            // =========================
            // QUESTIONS
            // =========================

            const {
                data: questionData,
                error: questionError,
            } = await supabase
                .from('questions')
                .select(
                    'id, user_id, category_id, type, question, options, correct_answer, image_url, created_at'
                )
                .order('created_at', {
                    ascending: false,
                })

            if (questionError) {
                console.error(questionError)
            } else {
                setQuestions(questionData || [])
            }

            // =========================
            // ANSWERS
            // =========================

            const {
                data: answerData,
                error: answerError,
            } = await supabase
                .from('answers')
                .select(
                    'id, question_id, user_id, answer_text, score, feedback, created_at'
                )
                .order('created_at', {
                    ascending: true,
                })

            if (answerError) {
                console.error(answerError)
            } else {
                const grouped: Record<string, Answer[]> = {}

                    ; (answerData || []).forEach((answer) => {
                        if (!grouped[answer.question_id]) {
                            grouped[answer.question_id] = []
                        }

                        grouped[answer.question_id].push(answer)
                    })

                setAnswersByQuestion(grouped)
            }

            // =========================
            // COMMENTS
            // =========================

            const {
                data: commentData,
                error: commentLoadError,
            } = await supabase
                .from('comments')
                .select(
                    'id, answer_id, user_id, comment_text, created_at'
                )
                .order('created_at', {
                    ascending: true,
                })

            if (commentLoadError) {
                console.error(commentLoadError)
            } else {
                const groupedComments: Record<
                    string,
                    Comment[]
                > = {}

                    ; (commentData || []).forEach((comment) => {
                        if (!groupedComments[comment.answer_id]) {
                            groupedComments[comment.answer_id] = []
                        }

                        groupedComments[comment.answer_id].push(
                            comment
                        )
                    })

                setCommentsByAnswer(groupedComments)
            }

            // =========================
            // PROFILES
            // =========================

            const userIds = new Set<string>()

                ; (questionData || []).forEach((question) => {
                    userIds.add(question.user_id)
                })

                ; (answerData || []).forEach((answer) => {
                    userIds.add(answer.user_id)
                })

                ; (commentData || []).forEach((comment) => {
                    userIds.add(comment.user_id)
                })

            if (userIds.size > 0) {
                const {
                    data: profileData,
                    error: profileError,
                } = await supabase
                    .from('profiles')
                    .select('id, nickname')
                    .in('id', Array.from(userIds))

                if (profileError) {
                    console.error(profileError)
                } else {
                    const nicknameMap: Record<string, string> = {}

                        ; (profileData || []).forEach((profile) => {
                            nicknameMap[profile.id] =
                                profile.nickname || 'User'
                        })

                    setNicknames(nicknameMap)
                }
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // =========================
    // SUBMIT ANSWER
    // =========================

    async function handleSubmit(questionId: string) {
        const text = draftAnswers[questionId]?.trim()

        if (!text) {
            setSubmitError((prev) => ({
                ...prev,
                [questionId]:
                    'Jawaban tidak boleh kosong.',
            }))

            return
        }

        if (!userId) {
            setSubmitError((prev) => ({
                ...prev,
                [questionId]:
                    'Silakan login terlebih dahulu.',
            }))

            return
        }

        const question = questions.find(
            (q) => q.id === questionId
        )

        if (!question) return

        setSubmitting(questionId)

        setSubmitError((prev) => ({
            ...prev,
            [questionId]: '',
        }))

        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: question.question,
                    answer: text,
                }),
            })

            const responseText = await response.text()

            let result: any

            try {
                result = JSON.parse(responseText)
            } catch {
                throw new Error(
                    responseText ||
                    'Response dari AI tidak valid.'
                )
            }

            if (!response.ok) {
                throw new Error(
                    result?.error ||
                    'Gagal mendapatkan penilaian AI.'
                )
            }

            const score =
                typeof result?.score === 'number'
                    ? result.score
                    : null

            const feedback =
                result?.feedback ||
                result?.explanation ||
                'Jawaban telah diperiksa oleh AI.'

            const {
                data: insertedAnswer,
                error: insertError,
            } = await supabase
                .from('answers')
                .insert({
                    question_id: questionId,
                    user_id: userId,
                    answer_text: text,
                    score,
                    feedback,
                    correction:
                        result?.correction || null,
                    correct_answer:
                        result?.correctAnswer || null,
                    is_correct:
                        typeof result?.isCorrect ===
                            'boolean'
                            ? result.isCorrect
                            : null,
                })
                .select(
                    'id, question_id, user_id, answer_text, score, feedback, created_at'
                )
                .single()

            if (insertError) {
                throw insertError
            }

            setAnswersByQuestion((prev) => ({
                ...prev,
                [questionId]: [
                    ...(prev[questionId] || []),
                    insertedAnswer,
                ],
            }))

            setDraftAnswers((prev) => ({
                ...prev,
                [questionId]: '',
            }))

            setAnswerOpen((prev) => ({
                ...prev,
                [questionId]: false,
            }))

            setDiscussionOpen((prev) => ({
                ...prev,
                [questionId]: true,
            }))
        } catch (error: any) {
            console.error(error)

            setSubmitError((prev) => ({
                ...prev,
                [questionId]:
                    error?.message ||
                    'Terjadi kesalahan saat mengirim jawaban.',
            }))
        } finally {
            setSubmitting(null)
        }
    }

    // =========================
    // SUBMIT COMMENT
    // =========================

    async function handleCommentSubmit(answerId: string) {
        const text = commentDrafts[answerId]?.trim()

        if (!text) {
            setCommentError((prev) => ({
                ...prev,
                [answerId]:
                    'Komentar tidak boleh kosong.',
            }))

            return
        }

        if (!userId) {
            setCommentError((prev) => ({
                ...prev,
                [answerId]:
                    'Silakan login terlebih dahulu.',
            }))

            return
        }

        setCommenting(answerId)

        setCommentError((prev) => ({
            ...prev,
            [answerId]: '',
        }))

        try {
            const {
                data: insertedComment,
                error,
            } = await supabase
                .from('comments')
                .insert({
                    answer_id: answerId,
                    user_id: userId,
                    comment_text: text,
                })
                .select(
                    'id, answer_id, user_id, comment_text, created_at'
                )
                .single()

            if (error) {
                throw error
            }

            setCommentsByAnswer((prev) => ({
                ...prev,
                [answerId]: [
                    ...(prev[answerId] || []),
                    insertedComment,
                ],
            }))

            setCommentDrafts((prev) => ({
                ...prev,
                [answerId]: '',
            }))
        } catch (error: any) {
            console.error(error)

            setCommentError((prev) => ({
                ...prev,
                [answerId]:
                    error?.message ||
                    'Gagal mengirim komentar.',
            }))
        } finally {
            setCommenting(null)
        }
    }

    // =========================
    // DELETE QUESTION
    // =========================

    async function handleDelete(questionId: string) {
        if (!userId) return

        const confirmed = window.confirm(
            'Apakah kamu yakin ingin menghapus pertanyaan ini?'
        )

        if (!confirmed) return

        setDeleting(questionId)

        try {
            const { error } = await supabase
                .from('questions')
                .delete()
                .eq('id', questionId)
                .eq('user_id', userId)

            if (error) {
                throw error
            }

            setQuestions((prev) =>
                prev.filter(
                    (q) => q.id !== questionId
                )
            )

            setAnswersByQuestion((prev) => {
                const next = { ...prev }

                delete next[questionId]

                return next
            })
        } catch (error) {
            console.error(error)

            alert('Gagal menghapus pertanyaan.')
        } finally {
            setDeleting(null)
        }
    }

    const filteredQuestions =
        questions.filter(
            (question) =>
                activeCategory === 'all' ||
                question.category_id === activeCategory
        )

    const getCategoryName = (
        categoryId: string | null
    ) => {
        if (!categoryId) return 'Umum'

        return (
            categories.find(
                (category) =>
                    category.id === categoryId
            )?.name || 'Umum'
        )
    }

    const getCategoryIndex = (
        categoryId: string | null
    ) => {
        if (!categoryId) return 0

        const index =
            categories.findIndex(
                (category) =>
                    category.id === categoryId
            )

        return index >= 0 ? index : 0
    }

    return (
        <div className="min-h-screen bg-[#F8F8FC] text-[#20202A]">

            {/* MOBILE OVERLAY */}

            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Tutup sidebar"
                    onClick={() =>
                        setSidebarOpen(false)
                    }
                    className="fixed inset-0 z-30 bg-black/30 sm:hidden"
                />
            )}

            {/* SIDEBAR */}

            <aside
                className={`
                    fixed
                    top-0
                    left-0
                    h-screen
                    w-72
                    bg-white
                    border-r
                    border-[#E8E8F0]
                    sm:border
                    sm:rounded-3xl
                    shadow-sm
                    flex
                    flex-col
                    z-40
                    transition-transform
                    duration-200
                    ${sidebarOpen
                        ? 'translate-x-0'
                        : '-translate-x-full'
                    }
                    sm:translate-x-0
                `}
            >

                {/* HOME */}

                <div className="px-4 pt-4">

                    <Link
                        href="/"
                        onClick={() =>
                            setSidebarOpen(false)
                        }
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-[#F3F2FF] transition"
                    >
                        <Home size={18} />

                        <span className="font-medium text-sm">
                            Beranda
                        </span>
                    </Link>

                </div>

                {/* CATEGORY TITLE */}

                <div className="px-5 pt-5 pb-2">

                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Kategori
                    </p>

                </div>

                {/* CATEGORY */}

                <nav className="flex-1 overflow-y-auto px-4 pb-4">

                    {/* SEMUA */}

                    <button
                        type="button"
                        onClick={() => {
                            setActiveCategory('all')
                            setSidebarOpen(false)
                        }}
                        className={`
                            w-full
                            flex
                            items-center
                            gap-3
                            px-3.5
                            py-2.5
                            rounded-xl
                            text-left
                            transition
                            ${activeCategory === 'all'
                                ? 'bg-[#6C63FF] text-white'
                                : 'hover:bg-[#F5F5FA]'
                            }
                        `}
                    >

                        <div
                            className={`
                                w-8
                                h-8
                                rounded-lg
                                flex
                                items-center
                                justify-center
                                ${activeCategory === 'all'
                                    ? 'bg-white/20'
                                    : 'bg-gray-100'
                                }
                            `}
                        >
                            <FileText size={16} />
                        </div>

                        <div className="flex-1">

                            <p className="font-medium text-sm">
                                Semua
                            </p>

                            <p
                                className={`text-[11px] ${activeCategory === 'all'
                                    ? 'text-white/70'
                                    : 'text-gray-400'
                                    }`}
                            >
                                Semua pertanyaan
                            </p>

                        </div>

                        <span className="text-[11px]">
                            {questions.length}
                        </span>

                    </button>

                    {/* CATEGORIES */}

                    <div className="mt-1.5 space-y-0.5">

                        {categories.map(
                            (category, index) => {

                                const active =
                                    activeCategory ===
                                    category.id

                                const count =
                                    questions.filter(
                                        (question) =>
                                            question.category_id ===
                                            category.id
                                    ).length

                                return (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => {
                                            setActiveCategory(
                                                category.id
                                            )

                                            setSidebarOpen(
                                                false
                                            )
                                        }}
                                        className={`
                                            w-full
                                            flex
                                            items-center
                                            gap-3
                                            px-3.5
                                            py-2.5
                                            rounded-xl
                                            text-left
                                            transition
                                            ${active
                                                ? 'bg-[#F0EFFF] text-[#5B52E8]'
                                                : 'hover:bg-[#F5F5FA]'
                                            }
                                        `}
                                    >

                                        <div
                                            className={`
                                                w-8
                                                h-8
                                                rounded-lg
                                                flex
                                                items-center
                                                justify-center
                                                ${active
                                                    ? 'bg-[#6C63FF] text-white'
                                                    : colorFor(
                                                        index
                                                    )
                                                }
                                            `}
                                        >
                                            <BookOpen size={15} />
                                        </div>

                                        <div className="flex-1 min-w-0">

                                            <p className="font-medium text-sm truncate">
                                                {category.name}
                                            </p>

                                            <p className="text-[11px] text-gray-400">
                                                {count} pertanyaan
                                            </p>

                                        </div>

                                        <span className="text-[11px] text-gray-400">
                                            {count}
                                        </span>

                                    </button>
                                )
                            }
                        )}

                    </div>

                </nav>

                {/* FOOTER */}

                <div className="p-4 border-t border-[#EEEEF3]">

                    <Link
                        href="/create"
                        onClick={() =>
                            setSidebarOpen(false)
                        }
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5B52E8] text-white text-sm font-semibold transition"
                    >
                        <Plus size={17} />
                        Buat Pertanyaan
                    </Link>

                </div>

            </aside>

            {/* MAIN */}

            <div className="sm:px-4 sm:pt-4">

                <main className="min-w-0 sm:ml-72">

                    {/* MOBILE HEADER */}

                    <div className="sticky top-0 z-20 bg-[#F8F8FC]/95 backdrop-blur-sm px-4 py-2.5 sm:hidden">

                        <div className="flex items-center justify-between bg-white rounded-xl border border-[#E8E8F0] px-2.5 py-2 shadow-sm">

                            <button
                                type="button"
                                onClick={() =>
                                    setSidebarOpen(true)
                                }
                                className="p-1.5 rounded-lg hover:bg-gray-100"
                            >
                                <Menu size={20} />
                            </button>

                            <div className="font-semibold text-sm">
                                Pertanyaan & Diskusi
                            </div>

                            <Link
                                href="/tanya"
                                className="p-1.5 rounded-lg bg-[#6C63FF] text-white"
                            >
                                <Plus size={18} />
                            </Link>

                        </div>

                    </div>

                    {/* CONTENT */}

                    <div className="px-4 py-4 sm:px-5 sm:py-5">

                        {/* HEADER */}

                        <div className="mb-5">

                            <div className="flex items-start justify-between gap-4">

                                <div>

                                    <div className="flex items-center gap-2 mb-1.5">

                                        <Sparkles
                                            size={17}
                                            className="text-[#6C63FF]"
                                        />

                                        <span className="text-sm font-semibold text-[#6C63FF]">
                                            Ruang Belajar
                                        </span>

                                    </div>

                                    <h2 className="text-xl sm:text-2xl font-bold">
                                        Pertanyaan & Diskusi
                                    </h2>

                                    <p className="mt-1.5 text-gray-500 text-sm">
                                        Lihat pertanyaan, jawab soal,
                                        dan dapatkan feedback dari AI.
                                    </p>

                                </div>

                                <Link
                                    href="/tanya"
                                    className="hidden sm:flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5B52E8] text-white text-sm font-semibold transition"
                                >
                                    <Sparkles size={18} />
                                    Tanya AI
                                </Link>

                            </div>

                        </div>

                        {/* LOADING */}

                        {loading ? (

                            <div className="flex items-center justify-center py-16">

                                <div className="flex flex-col items-center gap-3">

                                    <div className="w-9 h-9 border-4 border-[#DDD9FF] border-t-[#6C63FF] rounded-full animate-spin" />

                                    <p className="text-sm text-gray-500">
                                        Memuat pertanyaan...
                                    </p>

                                </div>

                            </div>

                        ) : filteredQuestions.length === 0 ? (

                            <div className="bg-white border border-[#E8E8F0] rounded-2xl p-7 text-center">

                                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F0EFFF] text-[#6C63FF] flex items-center justify-center">

                                    <MessageCircle size={25} />

                                </div>

                                <h3 className="mt-4 text-base font-bold">
                                    Belum ada pertanyaan
                                </h3>

                                <p className="mt-1.5 text-sm text-gray-500">
                                    Belum ada pertanyaan pada
                                    kategori ini.
                                </p>

                                <Link
                                    href="/create"
                                    className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl bg-[#6C63FF] text-white text-sm font-semibold"
                                >
                                    <Plus size={17} />
                                    Buat Pertanyaan
                                </Link>

                            </div>

                        ) : (

                            <div className="space-y-4">

                                {filteredQuestions.map(
                                    (question) => {

                                        const questionAnswers =
                                            answersByQuestion[
                                            question.id
                                            ] || []

                                        const categoryIndex =
                                            getCategoryIndex(
                                                question.category_id
                                            )

                                        const categoryName =
                                            getCategoryName(
                                                question.category_id
                                            )

                                        const isAnswerOpen =
                                            answerOpen[
                                            question.id
                                            ] ?? false

                                        const isDiscussionOpen =
                                            discussionOpen[
                                            question.id
                                            ] ?? false

                                        const isOwner =
                                            userId ===
                                            question.user_id

                                        return (

                                            <article
                                                key={
                                                    question.id
                                                }
                                                className="bg-white border border-[#E8E8F0] rounded-2xl overflow-hidden shadow-sm"
                                            >

                                                <div className="p-4 sm:p-5">

                                                    {/* USER */}

                                                    <div className="flex items-start justify-between gap-4">

                                                        <div className="flex items-start gap-3 min-w-0">

                                                            <div
                                                                className={`
                                                                    w-10
                                                                    h-10
                                                                    shrink-0
                                                                    rounded-xl
                                                                    flex
                                                                    items-center
                                                                    justify-center
                                                                    font-bold
                                                                    text-sm
                                                                    ${colorFor(
                                                                    categoryIndex
                                                                )}
                                                                `}
                                                            >
                                                                {initialFor(
                                                                    nicknames[
                                                                    question.user_id
                                                                    ] ||
                                                                    'User'
                                                                )}
                                                            </div>

                                                            <div className="min-w-0">

                                                                <div className="flex flex-wrap items-center gap-2">

                                                                    <span className="font-semibold text-sm">
                                                                        {
                                                                            nicknames[
                                                                            question.user_id
                                                                            ] ||
                                                                            'User'
                                                                        }
                                                                    </span>

                                                                    <span className="text-gray-300">
                                                                        •
                                                                    </span>

                                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                        <Clock3
                                                                            size={
                                                                                12
                                                                            }
                                                                        />

                                                                        {timeAgo(
                                                                            question.created_at
                                                                        )}
                                                                    </span>

                                                                </div>

                                                                <div className="mt-1">

                                                                    <span className="inline-flex px-2 py-0.5 rounded-md bg-[#F3F2FF] text-[#5B52E8] text-[11px] font-medium">
                                                                        {
                                                                            categoryName
                                                                        }
                                                                    </span>

                                                                </div>

                                                            </div>

                                                        </div>

                                                        {isOwner && (

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        question.id
                                                                    )
                                                                }
                                                                disabled={
                                                                    deleting ===
                                                                    question.id
                                                                }
                                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                                                                title="Hapus pertanyaan"
                                                            >
                                                                <Trash2
                                                                    size={
                                                                        17
                                                                    }
                                                                />
                                                            </button>

                                                        )}

                                                    </div>

                                                    {/* QUESTION */}

                                                    <div className="mt-4">

                                                        <h3 className="text-base sm:text-lg font-bold leading-relaxed">
                                                            {
                                                                question.question
                                                            }
                                                        </h3>

                                                    </div>

                                                    {/* IMAGE */}

                                                    {question.image_url && (

                                                        <div className="mt-4">

                                                            <div className="flex items-center gap-2 mb-2">

                                                                <ImageIcon
                                                                    size={
                                                                        15
                                                                    }
                                                                    className="text-gray-400"
                                                                />

                                                                <span className="text-xs text-gray-400">
                                                                    Gambar soal
                                                                </span>

                                                            </div>

                                                            <img
                                                                src={
                                                                    question.image_url
                                                                }
                                                                alt="Gambar soal"
                                                                className="w-full max-h-[420px] rounded-xl border border-[#E8E8F0] object-contain bg-gray-50"
                                                            />

                                                        </div>

                                                    )}

                                                    {/* ANSWER TOGGLE */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setAnswerOpen(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [question.id]:
                                                                        !isAnswerOpen,
                                                                })
                                                            )
                                                        }
                                                        className={`
                                                            mt-4
                                                            w-full
                                                            flex
                                                            items-center
                                                            justify-between
                                                            px-3.5
                                                            py-2.5
                                                            rounded-xl
                                                            border
                                                            transition
                                                            ${isAnswerOpen
                                                                ? 'border-[#D8D4FF] bg-[#F7F6FF] text-[#5B52E8]'
                                                                : 'border-[#E8E8F0] bg-[#FAFAFC] hover:bg-[#F3F2FF]'
                                                            }
                                                        `}
                                                    >

                                                        <div className="flex items-center gap-2">

                                                            <Bot
                                                                size={17}
                                                                className={
                                                                    isAnswerOpen
                                                                        ? 'text-[#6C63FF]'
                                                                        : 'text-gray-500'
                                                                }
                                                            />

                                                            <span className="text-sm font-semibold">

                                                                {isAnswerOpen
                                                                    ? 'Tutup jawaban'
                                                                    : 'Jawab Pertanyaan'}

                                                            </span>

                                                        </div>

                                                        {isAnswerOpen ? (
                                                            <ChevronUp size={17} />
                                                        ) : (
                                                            <ChevronDown size={17} />
                                                        )}

                                                    </button>

                                                    {/* ANSWER FORM */}

                                                    {isAnswerOpen && (

                                                        <div className="mt-3 rounded-2xl bg-[#F8F8FC] border border-[#EEEEF3] p-3.5">

                                                            <div className="flex items-center gap-2 mb-2.5">

                                                                <Bot
                                                                    size={17}
                                                                    className="text-[#6C63FF]"
                                                                />

                                                                <span className="font-semibold text-sm">
                                                                    Jawaban kamu
                                                                </span>

                                                            </div>

                                                            {/* MCQ */}

                                                            {question.type ===
                                                                'mcq' &&
                                                                question.options &&
                                                                question.options.length >
                                                                0 ? (

                                                                <div className="space-y-1.5">

                                                                    {question.options.map(
                                                                        (
                                                                            option,
                                                                            index
                                                                        ) => {

                                                                            const letter =
                                                                                String.fromCharCode(
                                                                                    65 +
                                                                                    index
                                                                                )

                                                                            const current =
                                                                                draftAnswers[
                                                                                question.id
                                                                                ] ||
                                                                                ''

                                                                            const selected =
                                                                                current ===
                                                                                option ||
                                                                                current ===
                                                                                letter

                                                                            return (

                                                                                <button
                                                                                    key={
                                                                                        index
                                                                                    }
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        setDraftAnswers(
                                                                                            (
                                                                                                prev
                                                                                            ) => ({
                                                                                                ...prev,
                                                                                                [question.id]:
                                                                                                    option,
                                                                                            })
                                                                                        )
                                                                                    }
                                                                                    className={`
                                                                                        w-full
                                                                                        flex
                                                                                        items-center
                                                                                        gap-2.5
                                                                                        text-left
                                                                                        p-2.5
                                                                                        rounded-xl
                                                                                        border
                                                                                        transition
                                                                                        ${selected
                                                                                            ? 'border-[#6C63FF] bg-[#F0EFFF]'
                                                                                            : 'border-[#E8E8F0] bg-white hover:border-[#CFCBFF]'
                                                                                        }
                                                                                    `}
                                                                                >

                                                                                    <div
                                                                                        className={`
                                                                                            w-7
                                                                                            h-7
                                                                                            rounded-lg
                                                                                            flex
                                                                                            items-center
                                                                                            justify-center
                                                                                            text-xs
                                                                                            font-semibold
                                                                                            ${selected
                                                                                                ? 'bg-[#6C63FF] text-white'
                                                                                                : 'bg-gray-100 text-gray-600'
                                                                                            }
                                                                                        `}
                                                                                    >
                                                                                        {
                                                                                            letter
                                                                                        }
                                                                                    </div>

                                                                                    <span className="text-sm">
                                                                                        {
                                                                                            option
                                                                                        }
                                                                                    </span>

                                                                                </button>
                                                                            )
                                                                        }
                                                                    )}

                                                                </div>

                                                            ) : (

                                                                <textarea
                                                                    value={
                                                                        draftAnswers[
                                                                        question.id
                                                                        ] ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setDraftAnswers(
                                                                            (
                                                                                prev
                                                                            ) => ({
                                                                                ...prev,
                                                                                [question.id]:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            })
                                                                        )
                                                                    }
                                                                    placeholder="Tulis jawaban kamu di sini..."
                                                                    rows={3}
                                                                    className="w-full resize-none rounded-xl border border-[#E8E8F0] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#6C63FF] focus:ring-4 focus:ring-[#6C63FF]/10 transition"
                                                                />

                                                            )}

                                                            {/* ERROR */}

                                                            {submitError[
                                                                question.id
                                                            ] && (

                                                                    <p className="mt-2 text-xs text-red-500">
                                                                        {
                                                                            submitError[
                                                                            question.id
                                                                            ]
                                                                        }
                                                                    </p>

                                                                )}

                                                            {/* SUBMIT */}

                                                            <div className="mt-2.5 flex justify-end">

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleSubmit(
                                                                            question.id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        submitting ===
                                                                        question.id
                                                                    }
                                                                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#6C63FF] hover:bg-[#5B52E8] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
                                                                >

                                                                    {submitting ===
                                                                        question.id ? (
                                                                        <>
                                                                            <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />

                                                                            Memeriksa...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Send
                                                                                size={
                                                                                    15
                                                                                }
                                                                            />

                                                                            Kirim Jawaban
                                                                        </>
                                                                    )}

                                                                </button>

                                                            </div>

                                                        </div>

                                                    )}

                                                </div>

                                                {/* ANSWERS */}

                                                {questionAnswers.length >
                                                    0 && (

                                                        <div className="border-t border-[#EEEEF3]">

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setDiscussionOpen(
                                                                        (
                                                                            prev
                                                                        ) => ({
                                                                            ...prev,
                                                                            [question.id]:
                                                                                !isDiscussionOpen,
                                                                        })
                                                                    )
                                                                }
                                                                className="w-full flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-[#FAFAFC] transition"
                                                            >

                                                                <div className="flex items-center gap-2">

                                                                    <MessageCircle
                                                                        size={17}
                                                                        className="text-[#6C63FF]"
                                                                    />

                                                                    <span className="font-semibold text-sm">

                                                                        {
                                                                            questionAnswers.length
                                                                        }{' '}
                                                                        jawaban

                                                                    </span>

                                                                </div>

                                                                <div className="flex items-center gap-1.5 text-xs text-gray-400">

                                                                    {isDiscussionOpen
                                                                        ? 'Sembunyikan'
                                                                        : 'Lihat jawaban'}

                                                                    {isDiscussionOpen ? (
                                                                        <ChevronUp
                                                                            size={
                                                                                15
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        <ChevronDown
                                                                            size={
                                                                                15
                                                                            }
                                                                        />
                                                                    )}

                                                                </div>

                                                            </button>

                                                            {isDiscussionOpen && (

                                                                <div className="px-4 sm:px-5 pb-4 space-y-3">

                                                                    {questionAnswers.map(
                                                                        (
                                                                            answer
                                                                        ) => {

                                                                            const answerComments =
                                                                                commentsByAnswer[
                                                                                answer.id
                                                                                ] ||
                                                                                []

                                                                            const isCommentOpen =
                                                                                commentOpen[
                                                                                answer.id
                                                                                ] ??
                                                                                false

                                                                            return (

                                                                                <div
                                                                                    key={
                                                                                        answer.id
                                                                                    }
                                                                                    className="rounded-xl border border-[#EEEEF3] p-3.5"
                                                                                >

                                                                                    {/* ANSWER HEADER */}

                                                                                    <div className="flex items-start justify-between gap-4">

                                                                                        <div className="flex items-center gap-2.5">

                                                                                            <div className="w-8 h-8 rounded-lg bg-[#F0EFFF] text-[#6C63FF] flex items-center justify-center font-semibold text-xs">

                                                                                                {initialFor(
                                                                                                    nicknames[
                                                                                                    answer.user_id
                                                                                                    ] ||
                                                                                                    'User'
                                                                                                )}

                                                                                            </div>

                                                                                            <div>

                                                                                                <p className="font-semibold text-sm">

                                                                                                    {
                                                                                                        nicknames[
                                                                                                        answer.user_id
                                                                                                        ] ||
                                                                                                        'User'
                                                                                                    }

                                                                                                </p>

                                                                                                <p className="text-[11px] text-gray-400">

                                                                                                    {timeAgo(
                                                                                                        answer.created_at
                                                                                                    )}

                                                                                                </p>

                                                                                            </div>

                                                                                        </div>

                                                                                        {answer.score !==
                                                                                            null && (

                                                                                                <div className="flex items-center gap-1">

                                                                                                    <CheckCircle2
                                                                                                        size={
                                                                                                            15
                                                                                                        }
                                                                                                        className={scoreColor(
                                                                                                            answer.score
                                                                                                        )}
                                                                                                    />

                                                                                                    <span
                                                                                                        className={`text-sm font-bold ${scoreColor(
                                                                                                            answer.score
                                                                                                        )}`}
                                                                                                    >
                                                                                                        {
                                                                                                            answer.score
                                                                                                        }
                                                                                                    </span>

                                                                                                </div>

                                                                                            )}

                                                                                    </div>

                                                                                    {/* ANSWER TEXT */}

                                                                                    <div className="mt-3 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">

                                                                                        {
                                                                                            answer.answer_text
                                                                                        }

                                                                                    </div>

                                                                                    {/* AI FEEDBACK */}

                                                                                    {answer.feedback && (

                                                                                        <div className="mt-3 rounded-xl bg-[#F7F6FF] border border-[#E8E5FF] p-3">

                                                                                            <div className="flex items-center gap-2 mb-1.5">

                                                                                                <Sparkles
                                                                                                    size={
                                                                                                        15
                                                                                                    }
                                                                                                    className="text-[#6C63FF]"
                                                                                                />

                                                                                                <span className="text-xs font-semibold text-[#5B52E8]">
                                                                                                    Feedback AI
                                                                                                </span>

                                                                                            </div>

                                                                                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">

                                                                                                {
                                                                                                    answer.feedback
                                                                                                }

                                                                                            </p>

                                                                                        </div>

                                                                                    )}

                                                                                    {/* COMMENT TOGGLE */}

                                                                                    <div className="mt-3">

                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() =>
                                                                                                setCommentOpen(
                                                                                                    (
                                                                                                        prev
                                                                                                    ) => ({
                                                                                                        ...prev,
                                                                                                        [answer.id]:
                                                                                                            !isCommentOpen,
                                                                                                    })
                                                                                                )
                                                                                            }
                                                                                            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#6C63FF] transition"
                                                                                        >

                                                                                            <MessageCircle
                                                                                                size={
                                                                                                    14
                                                                                                }
                                                                                            />

                                                                                            {answerComments.length >
                                                                                                0
                                                                                                ? `${answerComments.length} komentar`
                                                                                                : 'Komentar'}

                                                                                            {isCommentOpen ? (
                                                                                                <ChevronUp
                                                                                                    size={
                                                                                                        13
                                                                                                    }
                                                                                                />
                                                                                            ) : (
                                                                                                <ChevronDown
                                                                                                    size={
                                                                                                        13
                                                                                                    }
                                                                                                />
                                                                                            )}

                                                                                        </button>

                                                                                    </div>

                                                                                    {/* COMMENT AREA */}

                                                                                    {isCommentOpen && (

                                                                                        <div className="mt-3 pl-3 border-l-2 border-[#EEEEF3]">

                                                                                            {/* EXISTING COMMENTS */}

                                                                                            {answerComments.length >
                                                                                                0 && (

                                                                                                    <div className="space-y-2.5 mb-3">

                                                                                                        {answerComments.map(
                                                                                                            (
                                                                                                                comment
                                                                                                            ) => (

                                                                                                                <div
                                                                                                                    key={
                                                                                                                        comment.id
                                                                                                                    }
                                                                                                                    className="rounded-xl bg-[#FAFAFC] border border-[#EEEEF3] p-3"
                                                                                                                >

                                                                                                                    <div className="flex items-start gap-2.5">

                                                                                                                        <div className="w-7 h-7 shrink-0 rounded-lg bg-[#F0EFFF] text-[#6C63FF] flex items-center justify-center font-semibold text-[11px]">
                                                                                                                            {initialFor(
                                                                                                                                nicknames[
                                                                                                                                comment.user_id
                                                                                                                                ] ||
                                                                                                                                'User'
                                                                                                                            )}
                                                                                                                        </div>

                                                                                                                        <div className="min-w-0 flex-1">

                                                                                                                            <div className="flex flex-wrap items-center gap-2">

                                                                                                                                <span className="font-semibold text-xs">
                                                                                                                                    {
                                                                                                                                        nicknames[
                                                                                                                                        comment.user_id
                                                                                                                                        ] ||
                                                                                                                                        'User'
                                                                                                                                    }
                                                                                                                                </span>

                                                                                                                                <span className="text-[10px] text-gray-400">
                                                                                                                                    {timeAgo(
                                                                                                                                        comment.created_at
                                                                                                                                    )}
                                                                                                                                </span>

                                                                                                                            </div>

                                                                                                                            <p className="mt-1 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                                                                                                                {
                                                                                                                                    comment.comment_text
                                                                                                                                }
                                                                                                                            </p>

                                                                                                                        </div>

                                                                                                                    </div>

                                                                                                                </div>

                                                                                                            )
                                                                                                        )}

                                                                                                    </div>

                                                                                                )}

                                                                                            {/* WRITE COMMENT */}

                                                                                            <div className="rounded-xl border border-[#E8E8F0] bg-white p-2.5">

                                                                                                <textarea
                                                                                                    value={
                                                                                                        commentDrafts[
                                                                                                        answer.id
                                                                                                        ] ||
                                                                                                        ''
                                                                                                    }
                                                                                                    onChange={(
                                                                                                        e
                                                                                                    ) =>
                                                                                                        setCommentDrafts(
                                                                                                            (
                                                                                                                prev
                                                                                                            ) => ({
                                                                                                                ...prev,
                                                                                                                [answer.id]:
                                                                                                                    e
                                                                                                                        .target
                                                                                                                        .value,
                                                                                                            })
                                                                                                        )
                                                                                                    }
                                                                                                    placeholder="Tulis komentar..."
                                                                                                    rows={2}
                                                                                                    className="w-full resize-none border-0 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-gray-400"
                                                                                                />

                                                                                                {commentError[
                                                                                                    answer.id
                                                                                                ] && (

                                                                                                        <p className="px-2 pb-1 text-xs text-red-500">
                                                                                                            {
                                                                                                                commentError[
                                                                                                                answer.id
                                                                                                                ]
                                                                                                            }
                                                                                                        </p>

                                                                                                    )}

                                                                                                <div className="flex justify-end">

                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() =>
                                                                                                            handleCommentSubmit(
                                                                                                                answer.id
                                                                                                            )
                                                                                                        }
                                                                                                        disabled={
                                                                                                            commenting ===
                                                                                                            answer.id
                                                                                                        }
                                                                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6C63FF] hover:bg-[#5B52E8] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold transition"
                                                                                                    >

                                                                                                        {commenting ===
                                                                                                            answer.id ? (
                                                                                                            <>
                                                                                                                <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />

                                                                                                                Mengirim...
                                                                                                            </>
                                                                                                        ) : (
                                                                                                            <>
                                                                                                                <Send
                                                                                                                    size={
                                                                                                                        13
                                                                                                                    }
                                                                                                                />

                                                                                                                Kirim
                                                                                                            </>
                                                                                                        )}

                                                                                                    </button>

                                                                                                </div>

                                                                                            </div>

                                                                                        </div>

                                                                                    )}

                                                                                </div>

                                                                            )
                                                                        }
                                                                    )}

                                                                </div>

                                                            )}

                                                        </div>

                                                    )}

                                            </article>

                                        )
                                    }
                                )}

                            </div>

                        )}

                    </div>

                </main>

            </div>

        </div>
    )
}