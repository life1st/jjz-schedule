import React, { useState, useEffect } from 'react';
import './EditNameModal.scss';

interface EditNameModalProps {
  initialName: string;
  onSave: (newName: string) => void;
  onClose: () => void;
}

export const EditNameModal: React.FC<EditNameModalProps> = ({ initialName, onSave, onClose }) => {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name.trim());
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <h3>修改显示名称</h3>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="输入显示名称"
            autoFocus
          />
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">取消</button>
            <button type="submit" className="save-btn">保存</button>
          </div>
        </form>
      </div>
    </div>
  );
};
