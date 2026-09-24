import { useEffect, useRef, useState } from 'react';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { useGSAP } from '@gsap/react';
import toast from 'react-hot-toast';
import { Mic, Paperclip, Send, Smile, Square, X } from 'lucide-react';
import clsx from 'clsx';
import { fileSize, duration as formatDuration } from '../../utils/format.js';
import useVoiceRecorder from '../../hooks/useVoiceRecorder.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import gsap, { DURATION, EASE, popIn, prefersReducedMotion } from '../../animations/motion.js';

const MessageComposer = ({ conversation, onSend, onTyping }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const emojiRef = useRef(null);
  const sendRef = useRef(null);
  const attachmentRef = useRef(null);
  const { recording, seconds, start, stop } = useVoiceRecorder();
  const { isDark } = useTheme();

  useGSAP(
    () => {
      if (!showEmoji || !emojiRef.current || prefersReducedMotion()) return;
      gsap.fromTo(
        emojiRef.current,
        { opacity: 0, y: 12, scale: 0.96, transformOrigin: 'bottom left' },
        { opacity: 1, y: 0, scale: 1, duration: DURATION.fast, ease: EASE.out }
      );
    },
    { dependencies: [showEmoji] }
  );

  useEffect(() => {
    if (file) popIn(attachmentRef.current, { from: 0.94 });
  }, [file]);

  useEffect(() => {
    setText('');
    setFile(null);
    setShowEmoji(false);
  }, [conversation?._id]);

  useEffect(() => {
    if (!showEmoji) return undefined;
    const onClickOutside = (event) => {
      if (!emojiRef.current?.contains(event.target)) setShowEmoji(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [showEmoji]);

  const deliver = async (payload) => {
    setSending(true);
    try {
      await onSend(payload);
      setText('');
      setFile(null);
      onTyping?.(false);
      if (!prefersReducedMotion() && sendRef.current) {
        gsap.fromTo(sendRef.current, { scale: 0.8 }, { scale: 1, duration: 0.3, ease: EASE.pop });
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const submit = async (event) => {
    event?.preventDefault();
    if (!text.trim() && !file) return;

    const formData = new FormData();
    if (text.trim()) formData.append('text', text.trim());
    if (file) formData.append('file', file);
    await deliver(formData);
  };

  const toggleRecording = async () => {
    if (!recording) {
      try {
        await start();
      } catch (error) {
        toast.error(error.message || 'Microphone unavailable');
      }
      return;
    }

    const result = await stop();
    if (!result) return;
    const formData = new FormData();
    formData.append('file', result.file);
    formData.append('type', 'audio');
    formData.append('duration', String(result.duration));
    await deliver(formData);
  };

  return (
    <form onSubmit={submit} className="glass border-t px-3 py-3 sm:px-4">
      {file && (
        <div ref={attachmentRef} className="mb-2 flex items-center gap-3 rounded-xl bg-ink-50 px-3 py-2 ring-1 ring-ink-100">
          <span className="min-w-0 flex-1 truncate text-xs text-ink-600">
            {file.name} <span className="text-ink-400">({fileSize(file.size)})</span>
          </span>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="rounded-md p-1 text-ink-400 hover:bg-panel hover:text-rose-500"
            aria-label="Remove attachment"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="relative flex items-end gap-2">
        {showEmoji && (
          <div ref={emojiRef} className="absolute bottom-14 left-0 z-30">
            <EmojiPicker
              width={320}
              height={380}
              theme={isDark ? EmojiTheme.DARK : EmojiTheme.LIGHT}
              onEmojiClick={(emoji) => setText((prev) => prev + emoji.emoji)}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl p-2.5 text-ink-400 transition hover:bg-ink-50 hover:text-brand-600"
          aria-label="Attach a file"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />

        <button
          type="button"
          onClick={() => setShowEmoji((value) => !value)}
          className={clsx(
            'rounded-xl p-2.5 transition hover:bg-ink-50',
            showEmoji ? 'text-brand-600' : 'text-ink-400 hover:text-brand-600'
          )}
          aria-label="Insert emoji"
        >
          <Smile className="h-5 w-5" />
        </button>

        {recording ? (
          <div className="flex flex-1 items-center gap-3 rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm text-rose-500">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" />
            Recording… {formatDuration(seconds)}
            <button
              type="button"
              onClick={() => stop(true)}
              className="ml-auto text-xs font-medium underline"
            >
              Discard
            </button>
          </div>
        ) : (
          <textarea
            rows={1}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              onTyping?.(Boolean(event.target.value));
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) submit(event);
            }}
            placeholder="Your message"
            className="input max-h-32 flex-1 resize-none py-2.5"
          />
        )}

        <button
          type="button"
          onClick={toggleRecording}
          className={clsx(
            'rounded-xl p-2.5 transition',
            recording
              ? 'bg-rose-600 text-white hover:bg-rose-700'
              : 'text-ink-400 hover:bg-ink-50 hover:text-brand-600'
          )}
          aria-label={recording ? 'Send voice message' : 'Record a voice message'}
        >
          {recording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        <button
          ref={sendRef}
          type="submit"
          disabled={sending || recording || (!text.trim() && !file)}
          className="press rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 p-2.5 text-white shadow-sm shadow-brand-600/30 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
};

export default MessageComposer;
