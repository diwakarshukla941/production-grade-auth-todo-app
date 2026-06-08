import { UserContext } from '@/Context/UserContext'
import { api, authHeaders } from '@/lib/api'
import { Compass, LogOut } from 'lucide-react'
import React, { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { toast } from 'sonner'

const Navbar = () => {
    const context = useContext(UserContext)
    if (!context) {
        console.warn("UserContext not found. Navbar must be used within UserProvider.")
        return null
    }
    const { user, setUser } = context;
    const navigate = useNavigate()

    const logoutHandler = async () => {
        try {
            const res = await api.post('/auth/logout', {}, {
                headers: authHeaders(),
            })

            if (res.data.success) {
                setUser(null)
                localStorage.clear()
                toast.success(res.data.message)
                navigate('/login')
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to log out right now.')
        }
    }

    return (
        <nav className='sticky top-0 z-40 border-b border-black/8 bg-[#f6efe4]/80 backdrop-blur-xl'>
            <div className='mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6'>
                <Link to='/' className='flex items-center gap-3'>
                    <div className='rounded-full border border-[#a53a24]/15 bg-[#f9e7df] p-3 text-[#a53a24]'>
                        <Compass className='h-5 w-5' />
                    </div>
                    <div>
                        <p className='text-[10px] uppercase tracking-[0.34em] text-[#7c7168]'>Todo Studio</p>
                        <h1 className='todo-display text-2xl leading-none text-[#1f1b16]'>Quiet Ledger</h1>
                    </div>
                </Link>

                <div className='hidden rounded-full border border-[#1f1b16]/8 bg-white/55 px-4 py-2 text-sm text-[#554b42] md:flex'>
                    Plan the work. Close the loop.
                </div>

                <div className='flex items-center gap-3'>
                    {user ? (
                        <>
                            <div className='flex items-center gap-3 rounded-full border border-[#1f1b16]/8 bg-white/65 px-3 py-2'>
                                <Avatar className='h-9 w-9 border border-[#1f1b16]/10'>
                                    <AvatarImage src={user?.avatar} />
                                    <AvatarFallback>{user?.username?.substring(0, 2)?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className='hidden text-left md:block'>
                                    <p className='text-xs uppercase tracking-[0.26em] text-[#7c7168]'>Signed in</p>
                                    <p className='text-sm font-medium text-[#1f1b16]'>{user?.username}</p>
                                </div>
                            </div>

                            <Button
                                variant='outline'
                                className='rounded-full border-[#1f1b16]/10 bg-white/70 px-4 text-[#1f1b16] hover:bg-white'
                                onClick={logoutHandler}
                            >
                                <LogOut className='h-4 w-4' />
                                Logout
                            </Button>
                        </>
                    ) : (
                        <Link to={'/login'}>
                            <Button className='rounded-full bg-[#1f1b16] px-4 text-[#f8f0e4] hover:bg-[#352923]'>
                                Login
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default Navbar
