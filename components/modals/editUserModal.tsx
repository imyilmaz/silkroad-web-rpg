'use client';

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";

interface EditUserModalProps {
  open: boolean;
  user: {
    id: number;
    username: string;
    email: string;
  };
  onSave: (updatedData: {
    id: number;
    username: string;
    email: string;
    password?: string;
  }) => void;
  onDelete: (userId: number) => void;
  onClose: () => void;
}

const EditUserModal = ({
  open,
  user,
  onSave,
  onDelete,
  onClose,
}: EditUserModalProps) => {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");

  useEffect(() => {
    setUsername(user.username);
    setEmail(user.email);
    setPassword("");
  }, [user]);

  const handleSave = () => {
    onSave({ id: user.id, username, email, password: password || undefined });
    onClose();
  };

  const handleDelete = () => {
    const confirmDelete = window.confirm(
      "Bu kullan\u0131c\u0131y\u0131 kal\u0131c\u0131 olarak silmek istedi\u011finize emin misiniz?",
    );
    if (confirmDelete) {
      onDelete(user.id);
      onClose();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal-content">
          <Dialog.Title>Kullan\u0131c\u0131y\u0131 D\u00fczenle</Dialog.Title>
          <div className="form-group">
            <label>Kullan\u0131c\u0131 Ad\u0131</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Yeni \u015eifre (opsiyonel)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button className="save-btn" onClick={handleSave}>
              Kaydet
            </button>
            <button className="delete-btn" onClick={handleDelete}>
              Kal\u0131c\u0131 Olarak Sil
            </button>
          </div>
          <Dialog.Close className="close-btn">Kapat</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default EditUserModal;
