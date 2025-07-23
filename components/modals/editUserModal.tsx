'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { useEffect, useState } from 'react'

interface EditUserModalProps {
  open: boolean 
  user: {
    id: number
    username: string
    email: string
  }
  onSave: (updatedData: { id: number, username: string, email: string, password?: string }) => void
  onDelete: (userId: number) => void
  onClose: () => void
}

const EditUserModal = ({ open, user, onSave, onDelete, onClose }: EditUserModalProps) => {
  const [username, setUsername] = useState(user.username)
  const [email, setEmail] = useState(user.email)
  const [password, setPassword] = useState('')

  useEffect(() => {
    setUsername(user.username)
    setEmail(user.email)
    setPassword('')
  }, [user])

  const handleSave = () => {
    onSave({ id: user.id, username, email, password: password || undefined })
    onClose()
  }

  const handleDelete = () => {
    const confirmDelete = window.confirm('Bu kullanıcıyı kalıcı olarak silmek istediğinizden emin misiniz?')
    if (confirmDelete) {
      onDelete(user.id)
      onClose()
    }
  }


  return (
    <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal-content">
          <Dialog.Title>Kullanıcıyı Düzenle</Dialog.Title>
          <div className="form-group">
            <label>Kullanıcı Adı</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Yeni Şifre (opsiyonel)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button className="save-btn" onClick={handleSave}>Kaydet</button>
            <button className="delete-btn" onClick={handleDelete}>Kalıcı Olarak Sil</button>
          </div>
          <Dialog.Close className="close-btn">Kapat</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default EditUserModal
