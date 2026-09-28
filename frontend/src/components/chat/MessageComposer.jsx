import { useEffect, useRef, useState } from 'react';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { useGSAP } from '@gsap/react';
import toast from 'react-hot-toast';
import { Mic, Paperclip, Send, Smile, Square, Trash2, X } from 'lucide-react';
import clsx from 'clsx';
import { fileSize, duration as formatDuration } from '../../utils/format.js';
import useVoiceRecorder from '../../hooks/useVoiceRecorder.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import gsap, { DURATION, EASE, popIn, skipMotion } from '../../animations/motion.js';

const MAX_LENGTH = 5000;

/** Five bars jittering while the mic is open, so recording looks like it is listening. */
const Waveform = () => {
  const ref = useRef(null);

  useGSAP(() => {
    const bars = ref.current?.children;
    if (!bars?.length || skipMotion()) return;
    gsap.to(bars, {
      scaleY: () => 0.35 + Math.random() * 0.9,
      duration: 0.32,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      stagger: { each: 0.07, from: 'center' },
      transformOrigin: 'center',
    });
  }, {});

  return (
    <span ref={ref} className="flex items-center gap-[3px]" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className="h-4 w-[3px] rounded-full bg-rose-500" />
      ))}
    </span>
  );
};

const MessageComposer = ({ conversation, onSend, onTyping }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const emojiRef = useRef(null);
  const sendRef = useRef(null);
  const textRef = useRef(null);
  const attachmentRef = useRef(null);
  const { recording, seconds, start, stop } = useVoiceRecorder();
  const { isDark } = useTheme();

  const hasContent = Boolean(text.trim() || file);

  useGSAP(
    () => {
      if (!showEmoji || !emojiRef.current || skipMotion()) return;
      gsap.fromTo(
        emojiRef.current,
        { opacity: 0, y: 12, scale: 0.96, transformOrigin: 'bottom left' },
        { opacity: 1, y: 0, scale: 1, duration: DURATION.fast, ease: EASE.out }
      );
    },
    { dependencies: [showEmoji] }
  );

  // The send button grows in as soon as there is something to send.
  useGSAP(
    () => {
      if (!sendRef.current || skipMotion()) return;
      gsap.to(sendRef.current, {
        scale: hasContent ? 1 : 0.88,
        rotate: hasContent ? 0 : -12,
        duration: DURATION.fast,
        ease: EASE.pop,
      });
    },
    { dependencies: [hasContent] }
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

  /** Grows the field with the message instead of scrolling inside one line. */
  const resize = (node) => {
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${Math.min(node.scrollHeight, 160)}px`;
  };

  useEffect(() => {
    resize(textRef.current);
  }, [text]);

  const deliver = async (payload) => {
    setSending(true);
    try {
      await onSend(payload);
      setText('');
      setFile(null);
      onTyping?.(false);
      if (!skipMotion() && sendRef.current) {
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

  const remaining = MAX_LENGTH - text.length;

  return (
    <form onSubmit={submit} className="glass relative border-t px-3 py-3 sm:px-4">
      {file && (
        <div
          ref={attachmentRef}
          className="mb-2 flex items-center gap-3 rounded-xl border border-line bg-raised px-3 py-2"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-300">
            <Paperclip className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1 truncate text-xs text-ink-600">
            {file.name} <span className="text-ink-400">({fileSize(file.size)})</span>
          </span>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="press rounded-md p-1 text-ink-400 transition hover:bg-rose-500/10 hover:text-rose-500"
            aria-label="Remove attachment"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {showEmoji && (
        <div ref={emojiRef} className="absolute bottom-[4.5rem] left-3 z-30 overflow-hidden rounded-2xl shadow-float">
          <EmojiPicker
            width={320}
            height={380}
            theme={isDark ? EmojiTheme.DARK : EmojiTheme.LIGHT}
            onEmojiClick={(emoji) => setText((prev) => prev + emoji.emoji)}
          />
        </div>
      )}

      {/*
       * The whole row is one control surface: it picks up the focus ring as a
       * unit, so the composer reads as a single object rather than five buttons.
       */}
      <div
        className={clsx(
          'flex items-end gap-1 rounded-2xl border bg-raised p-1.5 transition duration-200',
          recording
            ? 'border-rose-500/40 bg-rose-500/5'
            : 'border-line focus-within:border-brand-400 focus-within:bg-panel focus-within:ring-4 focus-within:ring-brand-500/15'
        )}
      >
        {!recording && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="press shrink-0 rounded-xl p-2.5 text-ink-400 transition hover:bg-brand-500/10 hover:text-brand-600"
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
                'press shrink-0 rounded-xl p-2.5 transition duration-300 hover:bg-brand-500/10 hover:text-brand-600',
                showEmoji ? 'rotate-12 text-brand-600' : 'text-ink-400'
              )}
              aria-label="Insert emoji"
            >
              <Smile className="h-5 w-5" />
            </button>
          </>
        )}

        {recording ? (
          <div className="flex flex-1 items-center gap-3 px-3 py-2.5 text-sm text-rose-500">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500/70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
            </span>
            <Waveform />
            <span className="font-medium tabular-nums">{formatDuration(seconds)}</span>
            <button
              type="button"
              onClick={() => stop(true)}
              className="press ml-auto flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition hover:bg-rose-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Discard
            </button>
          </div>
        ) : (
          <textarea
            ref={textRef}
            rows={1}
            maxLength={MAX_LENGTH}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              onTyping?.(Boolean(event.target.value));
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) submit(event);
            }}
            placeholder="Write a message…"
            className="max-h-40 flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-0"
          />
        )}

        <button
          type="button"
          onClick={toggleRecording}
          className={clsx(
            'press shrink-0 rounded-xl p-2.5 transition',
            recording
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-600'
              : 'text-ink-400 hover:bg-brand-500/10 hover:text-brand-600'
          )}
          aria-label={recording ? 'Send voice message' : 'Record a voice message'}
        >
          {recording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        <button
          ref={sendRef}
          type="submit"
          disabled={sending || recording || !hasContent}
          className={clsx(
            'press shrink-0 rounded-xl p-2.5 text-white transition duration-200',
            'disabled:cursor-not-allowed disabled:active:scale-100',
            hasContent
              ? 'bg-brand-gradient shadow-glow hover:brightness-110'
              : 'bg-ink-100 text-ink-400 shadow-none'
          )}
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>

      {/* Only surfaces when the limit is actually close. */}
      {remaining < 200 && (
        <p className="mt-1.5 pr-1 text-right text-[11px] tabular-nums text-ink-400">
          {remaining} characters left
        </p>
      )}
    </form>
  );
};

export default MessageComposer;
