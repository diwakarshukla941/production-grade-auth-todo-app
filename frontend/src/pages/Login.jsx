import React, { useState, useContext } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'
import { UserContext } from '@/Context/UserContext'

const Login = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const context = useContext(UserContext)
  const setUser = context?.setUser
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    console.log(formData)

    try {
      setIsLoading(true)
      const res = await axios.post(`http://localhost:3000/api/auth/login`, formData, {
        headers: {
          "Content-Type": "application/json"
        }
      })
      if (res.data.success) {
        localStorage.setItem('accessToken', res.data.accessToken);
        setUser(res.data.user)
        navigate('/')
        toast.success(res.data.message)
      } else {
        setError(res.data.message)
      }
    } catch (error) {
      console.log(error);
      setError(error.response?.data?.message || "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }

  }
  return (
    <div className='relative w-full h-screen md:h-[760px] bg-green-100 overflow-hidden'>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md space-y-6 p-4">
          <div className="text-center space-y-2">
            <h1 className='text-3xl font-bold tracking-tight text-green-600'>Login into your account</h1>
            <p className='text-gray-600'>Start organising your thoughts and ideas today</p>
          </div>
          <Card className="w-full">
            <CardHeader className='space-y-1'>
              <CardTitle className='text-2xl text-center text-green-600'>Login</CardTitle>
              <CardDescription className='textt-center'>
                Login into your account to get started with Notes app
              </CardDescription>
            </CardHeader>
            <CardContent>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex item-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link className='text-sm' to={'/forgot-password'}>Forgot your password?</Link>
                  </div>

                  <div className="relative">
                    <Input name="password"
                      value={formData.password}
                      onChange={handleChange}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      required />
                    <Button
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      size='sm'
                      variant='ghost'
                      className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent '>
                      {
                        showPassword ?
                          <EyeOff className='w-4 h-4 text-gray-600' />
                          : <Eye className='w-4 h-4 text-gray-600' />
                      }
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-500" onClick={handleSubmit}>
                {isLoading
                  ? (<>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin ' />
                    Logging into your account...
                  </>)
                  : 'Login'}
              </Button>
              <p>Don't have an acccount, <Link className='underline text-md text-green-600 hover:text-green-500' to={'/signup'}>Register</Link></p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Login