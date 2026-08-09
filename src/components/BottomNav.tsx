import { NavLink } from 'react-router-dom'
import { CheckSquare2, UserRound } from 'lucide-react'

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <NavLink to="/app" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
        <CheckSquare2 strokeWidth={2.2} />
        Tasks
      </NavLink>
      <NavLink
        to="/app/profile"
        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
      >
        <UserRound strokeWidth={2.2} />
        Profile
      </NavLink>
    </nav>
  )
}
