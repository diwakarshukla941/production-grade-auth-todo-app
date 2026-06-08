import { UserContext } from '@/Context/UserContext'
import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({children}) => {
    const context = useContext(UserContext)
    const user = context?.user
  return (
    <div>
      {
        user ? children : <Navigate to={'/login'}/>
      }
    </div>
  )
}

export default ProtectedRoute
