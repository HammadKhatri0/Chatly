import { useEffect, useRef } from 'react';
import { popIn, typingDots } from '../../animations/motion.js';

/** Three bouncing dots in a bubble, mirroring how an incoming message looks. */
const TypingIndicator = ({ name }) => {
  const wrapRef = useRef(null);
  const dotsRef = useRef(null);

  useEffect(() => {
    popIn(wrapRef.current, { from: 0.9 });
    const dots = dotsRef.current?.children;
    const tween = dots ? typingDots(dots) : null;
    return () => tween?.kill();
  }, []);

  return (
    <div ref={wrapRef} className="flex items-end gap-2">
      <span className="w-8 shrink-0" />
      <div className="rounded-2xl rounded-bl-md border border-ink-100/70 bg-panel px-4 py-3 shadow-sm">
        <div ref={dotsRef} className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
        </div>
      </div>
      {name && <span className="pb-1 text-[11px] text-ink-400">{name} is typing</span>}
    </div>
  );
};

export default TypingIndicator;
