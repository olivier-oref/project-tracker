"use client";

import { useRef, useState } from "react";
import { matchSuggestions, resolveOwner } from "@/lib/owners";
import type { MemberInfo } from "@/components/tracker/note-block";

function tint(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/**
 * Owner field with the app's own suggestion list (the native datalist renders as keyboard chips and a
 * stray arrow on Android). Tap or arrow+Enter picks a name; any typed name is kept on blur/Enter.
 * `onCommit` is called once per change, with exactly what the field holds.
 */
export function OwnerInput({
  initial,
  members,
  suggestions,
  onCommit,
}: {
  initial: string;
  members: MemberInfo[];
  suggestions: string[];
  onCommit: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // What was last saved from this field: a pick saves at once, and the blur that follows must not
  // save again (or save stale text).
  const saved = useRef(initial);
  // Enter on a highlighted name picks it, then blurs while the field still shows the typed text.
  const skipNextBlur = useRef(false);

  const matches = open ? matchSuggestions(value, suggestions) : [];
  const memberId = resolveOwner(value, members).ownerId;
  const member = members.find((m) => m.id === memberId);
  const style = member
    ? ({ "--o": member.color, "--obg": tint(member.color, 0.14) } as React.CSSProperties)
    : undefined;

  function commit(next: string) {
    setOpen(false);
    setActive(-1);
    if (next.trim() === saved.current.trim()) return;
    saved.current = next;
    onCommit(next);
  }

  function pick(name: string) {
    setValue(name);
    commit(name);
  }

  function onBlur(e: React.FocusEvent<HTMLInputElement>) {
    if (skipNextBlur.current) {
      skipNextBlur.current = false;
      return;
    }
    commit(e.currentTarget.value);
  }

  return (
    <span className="owner-wrap" style={style}>
      <span className="owner-dot" />
      <input
        className="owner"
        aria-label="Owner"
        role="combobox"
        aria-expanded={matches.length > 0}
        aria-autocomplete="list"
        value={value}
        maxLength={80}
        autoComplete="off"
        placeholder="Unassigned"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && matches.length) {
            e.preventDefault();
            setActive((i) => (i + 1) % matches.length);
          } else if (e.key === "ArrowUp" && matches.length) {
            e.preventDefault();
            setActive((i) => (i <= 0 ? matches.length - 1 : i - 1));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (active >= 0 && matches[active]) {
              pick(matches[active]);
              skipNextBlur.current = true;
            }
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {matches.length ? (
        <ul className="owner-list" role="listbox" aria-label="Name suggestions">
          {matches.map((name, i) => (
            <li
              key={name}
              role="option"
              aria-selected={i === active}
              // mousedown, not click: picking must happen before the input's blur commits the typed text.
              onMouseDown={(e) => {
                e.preventDefault();
                pick(name);
              }}
            >
              {name}
            </li>
          ))}
        </ul>
      ) : null}
    </span>
  );
}
