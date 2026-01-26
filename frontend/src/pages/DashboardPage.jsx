import Dashboard from '../components/Dashboard'
import { useNavigate } from 'react-router-dom'

function DashboardPage() {
    const navigate = useNavigate()

    const handleClose = () => {
        navigate('/projects')
    }

    return (
        <div className="dashboard-page">
            <Dashboard isOpen={true} onClose={handleClose} />
        </div>
    )
}

export default DashboardPage
