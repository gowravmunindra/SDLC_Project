import DesignAgent from '../components/DesignAgent'
import { useNavigate } from 'react-router-dom'

function DesignPage() {
    const navigate = useNavigate()

    const handleComplete = (data) => {
        console.log('Design completed:', data)
        // Navigate to development phase
        navigate('/development')
    }

    const handleClose = () => {
        // Navigate back to dashboard
        navigate('/dashboard')
    }

    return (
        <div className="page-container">
            <DesignAgent 
                onClose={handleClose}
                onComplete={handleComplete}
            />
        </div>
    )
}

export default DesignPage
