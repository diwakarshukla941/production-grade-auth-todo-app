import { createContext, useContext, useState, useEffect } from "react";


export const UserContext = createContext(null)

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user')
        return storedUser ? JSON.parse(storedUser) : null
    })

    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user))
        } else {
            localStorage.removeItem('user')
        }
    }, [user])

    return <UserContext.Provider value={{ user, setUser }}>
        {children}
    </UserContext.Provider>
}

export const getData = () => {
    const context = useContext(UserContext)

    if (!context) {
        throw new Error("getData must be used within UserProvider")
    }

    return context
}
