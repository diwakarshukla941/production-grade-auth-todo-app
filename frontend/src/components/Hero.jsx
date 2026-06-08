import { ArrowRight, Zap } from 'lucide-react'
import React, { useContext } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '@/Context/UserContext'

const Hero = () => {
  const context = useContext(UserContext)
  const user = context?.user
  const navigate = useNavigate()

  return (
    <div className="relative w-full h-screen overflow-hidden bg-green-50 md:h-[700px]">
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            {user && <h1 className="text-2xl font-bold">Welcome {user.username}</h1>}

            <div className="space-y-2">
              <Badge variant="secondary" className="mb-4 border border-green-200 text-green-800">
                <Zap className="mr-1 h-3 w-3" />
                New: AI-powered note organization
              </Badge>
              <h1 className="text-3xl font-bold tracking-tighter text-green-600 sm:text-4xl md:text-5xl lg:text-6xl">
                Your thoughts, organized and accessible
                <span className="text-gray-800"> everywhere</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Capture ideas, organize thoughts, and collaborate seamlessly. The modern note-taking app that grows
                with you and keeps your ideas secure in the cloud.
              </p>
            </div>
            <div className="space-x-4">
              <Button
                onClick={() => navigate('/create-todo')}
                size="lg"
                className="relative h-12 bg-green-600 px-8 hover:bg-green-500"
              >
                Start Taking Notes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="h-12 bg-white px-8 text-green-800">
                Watch Demo
              </Button>
            </div>
            <p className="text-sm text-green-800">
              Free forever - No credit card required - 2 minutes setup
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Hero
