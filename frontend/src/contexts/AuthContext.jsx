import { createContext, useState, useContext, useEffect } from 'react'
import apiService from '../services/apiService'

const AuthContext = createContext()

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Check if user is logged in on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token')
            if (token) {
                try {
                    const response = await apiService.getMe()
                    setUser(response.data)
                } catch (error) {
                    console.error('Auth check failed:', error)
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                }
            }
            setLoading(false)
        }

        initAuth()
    }, [])

    const register = async (userData) => {
        try {
            setError(null)
            const response = await apiService.register(userData)
            const { token, ...user } = response.data
            
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
            setUser(user)
            
            return { success: true, user }
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed'
            setError(message)
            return { success: false, error: message }
        }
    }

    const login = async (credentials) => {
        try {
            setError(null)
            const response = await apiService.login(credentials)
            const { token, ...user } = response.data
            
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
            setUser(user)
            
            return { success: true, user }
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed'
            setError(message)
            return { success: false, error: message }
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
        window.location.href = '/login'
    }

    const value = {
        user,
        loading,
        error,
        register,
        login,
        logout,
        isAuthenticated: !!user
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
