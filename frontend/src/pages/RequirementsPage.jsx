import RequirementsAgent from '../components/RequirementsAgent'
import { useNavigate } from 'react-router-dom'

function RequirementsPage() {
    const navigate = useNavigate()

    const handleComplete = (data) => {
        console.log('Requirements completed:', data)
        // Navigate to design phase
        navigate('/design')
    }

    const handleClose = () => {
        // Navigate back to dashboard
        navigate('/dashboard')
    }

    return (
        <div className="page-container">
            <RequirementsAgent 
                onClose={handleClose}
                onComplete={handleComplete}
            />
        </div>
    )
}

export default RequirementsPage
