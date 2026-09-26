'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function SignUpPage() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const router = useRouter()

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()

        setLoading(true)
        setError('')

        const cleanName = name.trim()
        const cleanEmail = email.trim()

        // Daftar akun
        const {
            data,
            error: signUpError,
        } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
                data: {
                    nickname: cleanName,
                },
            },
        })

        if (signUpError) {
            setError(signUpError.message)
            setLoading(false)
            return
        }

        // Kalau user langsung mendapatkan session,
        // simpan nama ke profiles
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: data.user.id,
                    nickname: cleanName,
                })

            if (profileError) {
                console.error(
                    'Profile error:',
                    profileError
                )

                setError(
                    'Akun berhasil dibuat, tetapi nama gagal disimpan.'
                )

                setLoading(false)
                return
            }
        }

        router.push('/')

        setLoading(false)
    }

    return (
        <div className="min-h-screen flex">

            {/* LEFT */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#6C5CE7] relative overflow-hidden items-center justify-center p-12">

                <div className="absolute top-16 left-16 bg-[#FFC857] text-[#1A1A2E] px-4 py-2 rounded-full text-sm font-semibold rotate-[-6deg]">
                    Pilihan Ganda
                </div>

                <div className="absolute bottom-24 left-24 bg-white text-[#6C5CE7] px-4 py-2 rounded-full text-sm font-semibold rotate-[4deg]">
                    Esai
                </div>

                <div className="absolute top-32 right-20 bg-[#FF6B6B] text-white px-4 py-2 rounded-full text-sm font-semibold rotate-[3deg]">
                    Diskusi
                </div>

                <div className="absolute bottom-16 right-16 bg-[#00B894] text-white px-4 py-2 rounded-full text-sm font-semibold rotate-[-4deg]">
                    ✓ Review AI
                </div>

                <div className="text-center max-w-sm">
                    <h1
                        className="text-white text-4xl font-bold mb-4"
                        style={{
                            fontFamily:
                                'Space Grotesk, sans-serif',
                        }}
                    >
                        Sinau Bareng
                    </h1>

                    <p className="text-white/80 text-lg">
                        Ruang terbuka buat bikin soal,
                        jawab bareng, dan belajar dari satu
                        sama lain.
                    </p>
                </div>
            </div>

            {/* RIGHT */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-sm">

                    <h2
                        className="text-2xl font-bold mb-1 text-[#1A1A2E]"
                        style={{
                            fontFamily:
                                'Space Grotesk, sans-serif',
                        }}
                    >
                        Daftar
                    </h2>

                    <p className="text-[#6B6B80] mb-8">
                        Gabung dan mulai belajar bareng.
                    </p>

                    <form
                        onSubmit={handleSignUp}
                        className="flex flex-col gap-4"
                    >

                        {/* NAMA */}
                        <div>
                            <label className="text-sm font-medium text-[#1A1A2E] mb-1 block">
                                Nama
                            </label>

                            <input
                                type="text"
                                placeholder="Nama kamu"
                                value={name}
                                onChange={(e) =>
                                    setName(e.target.value)
                                }
                                className="w-full border border-[#ECECF4] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] transition"
                                required
                                minLength={2}
                                maxLength={50}
                            />
                        </div>

                        {/* EMAIL */}
                        <div>
                            <label className="text-sm font-medium text-[#1A1A2E] mb-1 block">
                                Email
                            </label>

                            <input
                                type="email"
                                placeholder="kamu@email.com"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                className="w-full border border-[#ECECF4] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] transition"
                                required
                            />
                        </div>

                        {/* PASSWORD */}
                        <div>
                            <label className="text-sm font-medium text-[#1A1A2E] mb-1 block">
                                Kata sandi
                            </label>

                            <input
                                type="password"
                                placeholder="Minimal 6 karakter"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                className="w-full border border-[#ECECF4] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] transition"
                                required
                                minLength={6}
                            />
                        </div>

                        {/* ERROR */}
                        {error && (
                            <p className="text-[#FF6B6B] text-sm">
                                {error}
                            </p>
                        )}

                        {/* BUTTON */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[#6C5CE7] hover:bg-[#5849c2] text-white rounded-xl p-3 font-medium transition disabled:opacity-60"
                        >
                            {loading
                                ? 'Memproses...'
                                : 'Daftar'}
                        </button>
                    </form>

                    <p className="text-sm text-[#6B6B80] mt-6 text-center">
                        Sudah punya akun?{' '}

                        <Link
                            href="/login"
                            className="text-[#6C5CE7] font-medium"
                        >
                            Masuk
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}