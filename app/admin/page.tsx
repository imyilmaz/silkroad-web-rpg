'use client'

import EditUserModal from '@/components/modals/editUserModal'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

type AdminUser = {
  id: number
  username: string
  email: string
  isAdmin: boolean
  isBlocked: boolean
  createdAt: string
}

type UpdateUserData = {
  id: number
  username: string
  email: string
  password?: string
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)

  const [maxLevelCurrent, setMaxLevelCurrent] = useState<number>(50)
  const [maxLevelPlannedCaps, setMaxLevelPlannedCaps] = useState<string>('')
  const [settingsUpdatedAt, setSettingsUpdatedAt] = useState<string | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)

  const isModalOpen = editingUser !== null
  const openEditModal = (user: AdminUser) => setEditingUser(user)
  const closeEditModal = () => setEditingUser(null)

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' })
      if (!res.ok) {
        throw new Error('Failed to load users')
      }
      const data = (await res.json()) as AdminUser[]
      setUsers(data)
    } catch (error) {
      console.error('Kullanıcılar yüklenemedi:', error)
      toast.error('Kullanıcı listesi yüklenemedi.')
    }
  }

  const fetchSettings = async () => {
    try {
      setSettingsLoading(true)
      const res = await fetch('/api/admin/settings', { cache: 'no-store' })
      if (!res.ok) {
        throw new Error('Failed to load settings')
      }

      const data = (await res.json()) as Array<{
        key: string
        value: any
        updatedAt?: string
      }>

      const maxLevel = data.find((setting) => setting.key === 'maxCharacterLevel')
      if (maxLevel) {
        const current = Number(maxLevel.value?.current)
        setMaxLevelCurrent(Number.isInteger(current) && current > 0 ? current : 50)

        const planned = Array.isArray(maxLevel.value?.plannedCaps)
          ? maxLevel.value.plannedCaps
              .map((entry: unknown) => Number(entry))
              .filter((entry: number) => Number.isInteger(entry) && entry > 0)
          : []
        setMaxLevelPlannedCaps(planned.join(', '))

        if (maxLevel.updatedAt) {
          setSettingsUpdatedAt(new Date(maxLevel.updatedAt).toLocaleString())
        } else {
          setSettingsUpdatedAt(null)
        }
      }
    } catch (error) {
      console.error('Ayarlar yüklenemedi:', error)
      toast.error('Genel ayarlar yüklenemedi.')
    } finally {
      setSettingsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchSettings()
  }, [])

  const handleToggleAdmin = async (userId: number) => {
    try {
      const res = await fetch('/api/admin/users/toggle-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!res.ok) {
        throw new Error()
      }

      toast.success('Admin durumu güncellendi.')
      await fetchUsers()
    } catch (error) {
      console.error('Admin durumu güncellenemedi:', error)
      toast.error('İşlem başarısız.')
    }
  }

  const handleToggleBlock = async (userId: number) => {
    try {
      const res = await fetch('/api/admin/users/toggle-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!res.ok) {
        throw new Error()
      }

      toast.success('Engel durumu güncellendi.')
      await fetchUsers()
    } catch (error) {
      console.error('Engel güncellenemedi:', error)
      toast.error('İşlem başarısız.')
    }
  }

  const handleUpdateUser = async (updatedData: UpdateUserData) => {
    try {
      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      })

      if (!res.ok) {
        throw new Error()
      }

      toast.success('Kullanıcı güncellendi.')
      fetchUsers()
    } catch (error) {
      console.error('Kullanıcı güncellenemedi:', error)
      toast.error('Güncelleme başarısız.')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!res.ok) {
        throw new Error()
      }

      toast.success('Kullanıcı silindi.')
      fetchUsers()
    } catch (error) {
      console.error('Kullanıcı silinemedi:', error)
      toast.error('Silme işlemi başarısız.')
    }
  }

  const handleSaveMaxLevel = async () => {
    const current = Number(maxLevelCurrent)
    if (!Number.isInteger(current) || current <= 0) {
      toast.error('Mevcut seviye sınırı pozitif bir tam sayı olmalıdır.')
      return
    }

    const plannedCaps = Array.from(
      new Set(
        maxLevelPlannedCaps
          .split(',')
          .map((entry) => Number(entry.trim()))
          .filter((entry) => Number.isInteger(entry) && entry > 0),
      ),
    ).sort((a, b) => a - b)

    setSettingsSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'maxCharacterLevel',
          value: {
            current,
            plannedCaps,
          },
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.message ?? 'Güncelleme başarısız.')
      }

      toast.success('Seviye sınırı güncellendi.')
      await fetchSettings()
    } catch (error: any) {
      console.error('Seviye sınırı güncellenemedi:', error)
      toast.error(error?.message ?? 'Ayar güncellemesi başarısız.')
    } finally {
      setSettingsSaving(false)
    }
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Paneli</h1>

      <section className="admin-settings">
        <h2>Genel Ayarlar</h2>
        <div className="settings-card">
          <div className="settings-row">
            <label htmlFor="max-level-input">Maksimum karakter seviyesi</label>
            <input
              id="max-level-input"
              type="number"
              min={1}
              value={maxLevelCurrent}
              onChange={(event) => {
                const next = Number(event.target.value)
                setMaxLevelCurrent(Number.isFinite(next) ? next : 1)
              }}
            />
          </div>
          <div className="settings-row">
            <label htmlFor="planned-caps-input">Planlanan seviye sınırları</label>
            <input
              id="planned-caps-input"
              type="text"
              placeholder="60, 70, 80, 90"
              value={maxLevelPlannedCaps}
              onChange={(event) => setMaxLevelPlannedCaps(event.target.value)}
            />
            <small>Virgül ile ayırın. Sadece pozitif tam sayılar dikkate alınır.</small>
          </div>
          <div className="settings-actions">
            <button className="btn green" onClick={handleSaveMaxLevel} disabled={settingsSaving}>
              {settingsSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button className="btn gray" onClick={fetchSettings} disabled={settingsLoading}>
              {settingsLoading ? 'Yenileniyor...' : 'Yenile'}
            </button>
          </div>
          {settingsUpdatedAt && (
            <p className="settings-meta">Son güncelleme: {settingsUpdatedAt}</p>
          )}
        </div>
      </section>

      <h2>Kullanıcı Listesi</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Kullanıcı Adı</th>
            <th>Email</th>
            <th>Admin mi?</th>
            <th>Engelli mi?</th>
            <th>Oluşturulma</th>
            <th>#</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.isAdmin ? 'Evet' : 'Hayır'}</td>
              <td>{user.isBlocked ? 'Evet' : 'Hayır'}</td>
              <td>{new Date(user.createdAt).toLocaleString()}</td>
              <td className="actions">
                {user.isAdmin ? (
                  <button className="btn yellow" onClick={() => handleToggleAdmin(user.id)}>
                    Admin Kaldır
                  </button>
                ) : (
                  <button className="btn green" onClick={() => handleToggleAdmin(user.id)}>
                    Admin Yap
                  </button>
                )}

                {user.isBlocked ? (
                  <button className="btn blue" onClick={() => handleToggleBlock(user.id)}>
                    Engeli Kaldır
                  </button>
                ) : (
                  <button className="btn red" onClick={() => handleToggleBlock(user.id)}>
                    Engelle
                  </button>
                )}

                <button className="btn gray" onClick={() => openEditModal(user)}>
                  Düzenle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && editingUser && (
        <EditUserModal
          open={isModalOpen}
          user={{
            id: editingUser.id,
            username: editingUser.username,
            email: editingUser.email,
          }}
          onClose={closeEditModal}
          onSave={handleUpdateUser}
          onDelete={handleDeleteUser}
        />
      )}
    </div>
  )
}

export default AdminDashboard
