'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
    const [nickname, setNickname] = useState<string | null>(null)
    const [query, setQuery] = useState('')
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('nickname')
                    .eq('id', user.id)
                    .single()
                setNickname(data?.nickname ?? null)
            }
        }
        load()
    }, [pathname])

    // Keep the search box in sync with the URL (e.g. after a browser back/forward).
    useEffect(() => {
        setQuery(searchParams.get('q') ?? '')
    }, [searchParams])

    if (pathname === '/login' || pathname === '/signup') return null

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const applyQuery = (value: string) => {
        setQuery(value)
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set('q', value)
        } else {
            params.delete('q')
        }
        // Filter live if we're already on the questions page; otherwise wait for Enter.
        if (pathname === '/progress') {
            router.replace(`/progress?${params.toString()}`, { scroll: false })
        }
    }

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && pathname !== '/progress') {
            const params = new URLSearchParams()
            if (query) params.set('q', query)
            router.push(`/progress?${params.toString()}`)
        }
    }

    return (
        <>
            {/* Top bar - desktop & mobile */}
            <header className="border-b border-[#ECECF4] sticky top-0 bg-white/90 backdrop-blur z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3 sm:gap-5">
                    <Link
                        href="/progress"
                        className="font-bold text-lg text-[#1A1A2E] shrink-0"
                        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                    >
                        Sinau Bareng
                    </Link>

                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6] text-sm">🔍</span>
                        <input
                            value={query}
                            onChange={(e) => applyQuery(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Cari soal..."
                            className="w-full bg-[#F7F7FB] rounded-full pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#6C5CE7]"
                        />
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {nickname && (
                            <span className="hidden sm:inline text-sm text-[#6B6B80]">{nickname}</span>
                        )}
                        <button
                            onClick={handleLogout}
                            className="text-sm text-[#FF6B6B] font-medium"
                        >
                            Keluar
                        </button>
                    </div>
                </div>
            </header>

            {/* Bottom nav - mobile only */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#ECECF4] flex z-10">
                <Link
                    href="/progress"
                    className={`flex-1 text-center py-3 text-sm font-medium ${pathname === '/progress' ? 'text-[#6C5CE7]' : 'text-[#6B6B80]'
                        }`}
                >
                    Pertanyaan
                </Link>
                <Link
                    href="/create"
                    className={`flex-1 text-center py-3 text-sm font-medium ${pathname === '/create' ? 'text-[#6C5CE7]' : 'text-[#6B6B80]'
                        }`}
                >
                    Buat Soal
                </Link>
            </nav>
        </>
    )
}