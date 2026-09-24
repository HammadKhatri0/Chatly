import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import clsx from 'clsx';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Avatar from '../ui/Avatar.jsx';
import { conversationApi } from '../../api/index.js';
import { useChat } from '../../context/ChatContext.jsx';

const NewGroupModal = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { createGroup, openConversation } = useChat();

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setAvatar(null);
    setSelected([]);
    conversationApi
      .candidates()
      .then(({ users }) => setCandidates(users))
      .catch((error) => toast.error(error.message));
  }, [open]);

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  const submit = async () => {
    if (!name.trim()) return toast.error('Give the group a name');
    if (!selected.length) return toast.error('Select at least one friend');

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('memberIds', JSON.stringify(selected));
      if (avatar) formData.append('avatar', avatar);

      const conversation = await createGroup(formData);
      toast.success('Group created');
      onClose();
      openConversation(conversation._id);
      navigate(`/chats/${conversation._id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New group"
      description="Groups can include any of your friends."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            Create group
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="group-name">
            Group name
          </label>
          <input
            id="group-name"
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Design team"
          />
        </div>

        <div>
          <label className="label" htmlFor="group-avatar">
            Group picture (optional)
          </label>
          <input
            id="group-avatar"
            type="file"
            accept="image/*"
            onChange={(event) => setAvatar(event.target.files?.[0] || null)}
            className="block w-full text-sm text-ink-400 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 dark:file:text-brand-300"
          />
        </div>

        <div>
          <p className="label">Members ({selected.length} selected)</p>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-ink-100 p-2">
            {candidates.length ? (
              candidates.map((candidate) => {
                const checked = selected.includes(candidate._id);
                return (
                  <button
                    key={candidate._id}
                    type="button"
                    onClick={() => toggle(candidate._id)}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition',
                      checked ? 'bg-brand-500/10' : 'hover:bg-ink-50'
                    )}
                  >
                    <Avatar src={candidate.avatar} name={candidate.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink-800">
                        {candidate.name}
                      </span>
                      <span className="block truncate text-xs text-ink-400">{candidate.email}</span>
                    </span>
                    <span
                      className={clsx(
                        'flex h-5 w-5 items-center justify-center rounded-md border',
                        checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-100'
                      )}
                    >
                      {checked && <Check className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="px-2 py-6 text-center text-sm text-ink-400">
                Add friends first to build a group.
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default NewGroupModal;
