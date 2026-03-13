import { NavLink } from 'react-router-dom';

const links = [
  { to: '/campaigns', label: 'Campaigns' },
  { to: '/campaigns/new', label: 'New campaign' },
  { to: '/dashboard', label: 'Dashboard' },
];

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 flex items-center gap-8 h-14">
        <span className="font-semibold text-gray-800 tracking-tight">AdTech</span>
        <div className="flex gap-6">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/campaigns'}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
