import VibeCodingAgent from '../components/VibeCodingAgent'
import { useNavigate } from 'react-router-dom'

function DevelopmentPage() {
    const navigate = useNavigate()

    const handleClose = () => {
        // Navigate back to dashboard
        navigate('/dashboard')
    }

    const handlePhaseComplete = () => {
        // Immediately navigate to testing
        navigate('/testing')
    }

    return (
        <VibeCodingAgent
            onClose={handleClose}
            onComplete={handlePhaseComplete}
        />
    )
}

export default DevelopmentPage
