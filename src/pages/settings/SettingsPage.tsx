// src/pages/settings/SettingsPage.tsx
import { useAuth } from '../../contexts/AuthContext'

export default function SettingsPage() {
  const { signOut, profile } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>
        <div className="space-y-2">
          <p className="text-gray-400">Email: {profile?.email}</p>
          <p className="text-gray-400">Role: {profile?.role}</p>
          <p className="text-gray-400">Name: {profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : 'Not set'}</p>
        </div>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Account Actions</h2>
        <button
          onClick={handleSignOut}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}