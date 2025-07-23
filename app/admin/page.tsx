'use client'

import EditUserModal from '@/components/modals/editUserModal'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'


const AdminDashboard = () => {
    const [users, setUsers] = useState([])
    const [editingUser, setEditingUser] = useState<any | null>(null)
    const isModalOpen = editingUser !== null
    const openEditModal = (user: any) => setEditingUser(user)
    const closeEditModal = () => setEditingUser(null)

    const fetchUsers = async () => {
        const res = await fetch('/api/admin/users', { cache: 'no-store' })
        const data = await res.json()
        setUsers(data)
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleToggleAdmin = async (userId: number) => {
        const res = await fetch('/api/admin/users/toggle-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        })

        if (res.ok) {
            toast.success('Admin durumu güncellendi.')
            await fetchUsers()
        } else {
            toast.error('İşlem başarısız.')
        }
    }

    const handleToggleBlock = async (userId: number) => {
        const res = await fetch('/api/admin/users/toggle-block', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        })
        console.log('[TOGGLE BLOCK] userId:', userId, '| typeof:', typeof userId)

        if (res.ok) {
            toast.success('Engel durumu güncellendi.')
            await fetchUsers()
        } else {
            toast.error('İşlem başarısız.')
        }
    }
    type UpdateUserData = {
        id: number
        username: string
        email: string
        password?: string
    }
    const handleUpdateUser = async (updatedData: UpdateUserData) => {
        const res = await fetch('/api/admin/users/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
        })

        if (res.ok) {
            toast.success('Kullanıcı güncellendi.')
            fetchUsers()
        } else {
            toast.error('Güncelleme başarısız.')
        }
    }

    const handleDeleteUser = async (userId: number) => {
        const res = await fetch('/api/admin/users/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        })

        if (res.ok) {
            toast.success('Kullanıcı silindi.')
            fetchUsers()
        } else {
            toast.error('Silme işlemi başarısız.')
        }
    }

    return (
        <div className="admin-dashboard">
            <h1>Admin Paneli</h1>
            <h2>Kullanıcı Listesi</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Kullanıcı Adı</th>
                        <th>Email</th>
                        <th>Admin mi?</th>
                        <th>Oluşturulma</th>
                        <th>#</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user: any) => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td>{user.isAdmin ? '✅' : '❌'}</td>
                            <td>{new Date(user.createdAt).toLocaleString()}</td>
                            <td className='actions'>
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
            {isModalOpen && (
                <EditUserModal
                    open={isModalOpen}
                    user={editingUser}
                    onClose={closeEditModal}
                    onSave={handleUpdateUser}
                    onDelete={handleDeleteUser}
                />
            )}
        </div>
    )
}

export default AdminDashboard
