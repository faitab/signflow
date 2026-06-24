
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FileSignature, LayoutDashboard, FileText, LogOut} from 'lucide-react'

const Navbar = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/documents', label: 'Documents', icon: FileText },
  ]

  return (
    <nav className="bg-base-900/80 backdrop-blur-xl border-b border-base-700 px-6 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-accent-500 to-accent-700 p-1.5 rounded-lg">
            <FileSignature className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">SignFlow</span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-accent-600/15 text-accent-400'
                    : 'text-gray-400 hover:text-white hover:bg-base-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:block">{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <div className="w-7 h-7 rounded-full bg-accent-600/20 border border-accent-600/30 flex items-center justify-center text-xs font-medium text-accent-300">
              {user?.name?.[0]}
            </div>
            <span className="text-sm hidden md:block">{user?.name}</span>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar