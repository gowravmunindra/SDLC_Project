import TestingAgent from '../components/TestingAgent'
import { useNavigate } from 'react-router-dom'

function TestingPage() {
    const navigate = useNavigate()

    const handleComplete = (data) => {
        console.log('Testing completed:', data)
        // Navigate back to dashboard (complete workflow)
        navigate('/dashboard')
    }

    const handleClose = () => {
        // Navigate back to dashboard
        navigate('/dashboard')
    }

    return (
        <div className="page-container">
            <TestingAgent 
                onClose={handleClose}
                onComplete={handleComplete}
            />
        </div>
    )
}

export default TestingPage
