import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Briefcase, GraduationCap, LogOut, Mail, MapPin, Phone, Trash2, UserPlus, X } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import { conversationApi, userApi } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { conversationAvatar, conversationTitle, otherMember } from '../../utils/format.js';

const Detail = ({ icon: Icon, label, value }) =>
  value ? (
    <div className="flex items-start gap-3 px-1 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-ink-400">{label}</p>
        <p className="break-words text-sm text-ink-800">{value}</p>
      </div>
    </div>
  ) : null;

const ConversationInfo = ({ conversation, onClose }) => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { friends, removeConversation, upsertConversation } = useChat();

  const [peerProfile, setPeerProfile] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [picked, setPicked] = useState([]);

  const title = conversationTitle(conversation, user?._id);
  const peer = otherMember(conversation, user?._id);
  const isGroupAdmin =
    isAdmin || conversation.admins?.some((admin) => String(admin._id || admin) === String(user?._id));

  const addable = useMemo(
    () =>
      friends.filter(
        (friend) => !conversation.members.some((member) => String(member._id) === String(friend._id))
      ),
    [friends, conversation.members]
  );

  useEffect(() => {
    if (conversation.isGroup || !peer?._id) return;
    userApi
      .byId(peer._id)
      .then(({ user: profile }) => setPeerProfile(profile))
      .catch(() => setPeerProfile(null));
  }, [conversation.isGroup, peer?._id]);

  const addMembers = async () => {
    try {
      const { conversation: updated } = await conversationApi.addMembers(conversation._id, picked);
      upsertConversation(updated);
      setPicked([]);
      setAddOpen(false);
      toast.success('Members added');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const leaveGroup = async () => {
    try {
      await conversationApi.removeMember(conversation._id, user._id);
      toast.success('You left the group');
      navigate('/chats');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const removeMember = async (memberId) => {
    try {
      const { conversation: updated } = await conversationApi.removeMember(conversation._id, memberId);
      upsertConversation(updated);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const deleteChat = async () => {
    try {
      await removeConversation(conversation._id);
      toast.success('Conversation deleted');
      navigate('/chats');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <aside className="absolute inset-0 z-20 w-full overflow-y-auto border-l border-ink-100 bg-white p-5 md:static md:z-auto md:w-80 md:shrink-0">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink-900">
          {conversation.isGroup ? 'Group info' : 'Contact info'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100"
          aria-label="Close panel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 pb-4 text-center">
        <Avatar src={conversationAvatar(conversation, user?._id)} name={title} size="xl" />
        <p className="text-lg font-semibold text-ink-900">{title}</p>
        <p className="text-xs text-ink-400">
          {conversation.isGroup ? `${conversation.members.length} members` : peer?.email}
        </p>
      </div>

      {!conversation.isGroup && (
        <div className="divide-y divide-ink-100 border-y border-ink-100">
          <Detail icon={Mail} label="Email" value={peerProfile?.email || peer?.email} />
          <Detail icon={Phone} label="Mobile" value={peerProfile?.mobile} />
          <Detail icon={MapPin} label="Address" value={peerProfile?.address} />
          <Detail icon={Briefcase} label="Work" value={peerProfile?.work} />
          <Detail icon={GraduationCap} label="Studies" value={peerProfile?.studies} />
        </div>
      )}

      {conversation.isGroup && (
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1 pb-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Members</h3>
            {isGroupAdmin && (
              <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>
                <UserPlus className="h-3.5 w-3.5" /> Add
              </Button>
            )}
          </div>
          {conversation.members.map((member) => (
            <div key={member._id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-ink-50">
              <Avatar src={member.avatar} name={member.name} size="sm" online={member.isOnline} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-800">
                  {member.name}
                  {String(member._id) === String(user?._id) && ' (you)'}
                </p>
                <p className="truncate text-xs text-ink-400">{member.email}</p>
              </div>
              {conversation.admins?.some((admin) => String(admin._id || admin) === String(member._id)) && (
                <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                  admin
                </span>
              )}
              {isGroupAdmin && String(member._id) !== String(user?._id) && (
                <button
                  type="button"
                  onClick={() => removeMember(member._id)}
                  className="rounded-lg p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Remove ${member.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-2">
        {conversation.isGroup && (
          <Button variant="outline" className="w-full" onClick={leaveGroup}>
            <LogOut className="h-4 w-4" /> Leave group
          </Button>
        )}
        {(isAdmin || String(conversation.createdBy) === String(user?._id)) && (
          <Button variant="danger" className="w-full" onClick={deleteChat}>
            <Trash2 className="h-4 w-4" /> Delete conversation
          </Button>
        )}
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add members"
        description="Only your friends can be added to a group."
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addMembers} disabled={!picked.length}>
              Add {picked.length || ''}
            </Button>
          </>
        }
      >
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {addable.length ? (
            addable.map((friend) => (
              <label
                key={friend._id}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-ink-50"
              >
                <input
                  type="checkbox"
                  checked={picked.includes(friend._id)}
                  onChange={(event) =>
                    setPicked((prev) =>
                      event.target.checked
                        ? [...prev, friend._id]
                        : prev.filter((id) => id !== friend._id)
                    )
                  }
                  className="h-4 w-4 rounded border-ink-100 text-brand-600 focus:ring-brand-300"
                />
                <Avatar src={friend.avatar} name={friend.name} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm text-ink-800">{friend.name}</span>
              </label>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-ink-400">
              All of your friends are already in this group.
            </p>
          )}
        </div>
      </Modal>
    </aside>
  );
};

export default ConversationInfo;
