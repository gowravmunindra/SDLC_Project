import DevelopmentAgent from '../components/DevelopmentAgent'
import { useNavigate } from 'react-router-dom'

function DevelopmentPage() {
    const navigate = useNavigate()

    const handleComplete = (data) => {
        console.log('Development completed:', data)
        // Navigate to testing phase
        navigate('/testing')
    }

    const handleClose = () => {
        // Navigate back to dashboard
        navigate('/dashboard')
    }

    return (
        <div className="page-container">
            <DevelopmentAgent 
                onClose={handleClose}
                onComplete={handleComplete}
            />
        </div>
    )
}

export default DevelopmentPage
