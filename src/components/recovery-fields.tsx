"use client";

import { useId, useState } from "react";
import { isRecoveryQuestion, recoveryQuestions, type RecoveryQuestion } from "@/lib/recovery-questions";

export function RecoveryFields({ inputClass, resetting = false }: { inputClass: string; resetting?: boolean }) {
  const [question, setQuestion] = useState<RecoveryQuestion | "">("");
  const hintId = useId();
  const selected = question === "pin" && resetting
    ? recoveryQuestions.pin.resetFormat
    : question ? recoveryQuestions[question] : null;

  return (
    <>
      <label className="block">
        Security question
        <select name="question" value={question} required className={inputClass} onChange={(event) => {
          const value = event.target.value;
          setQuestion(isRecoveryQuestion(value) ? value : "");
        }}>
          <option value="">Select a question</option>
          {Object.entries(recoveryQuestions).map(([value, option]) => (
            <option key={value} value={value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label className="block">
        Digits-only answer
        <input key={question} name="answer" type="password" inputMode="numeric" required disabled={!selected}
          pattern={selected?.pattern} maxLength={selected?.maxLength} autoComplete="off"
          aria-describedby={hintId} className={inputClass} />
        <span id={hintId} className="mt-1 block text-sm">{selected?.hint ?? "Select a security question first."}</span>
      </label>
    </>
  );
}
