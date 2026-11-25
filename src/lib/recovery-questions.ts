export const recoveryQuestions = {
  dob: { label: "What is your full date of birth?", hint: "Use YYYYMMDD (8 digits).", pattern: "[0-9]{8}", maxLength: 8 },
  mobile: { label: "What is your chosen mobile number?", hint: "Use 7 to 15 digits, including any leading zeros. Enter the same digits each time.", pattern: "[0-9]{7,15}", maxLength: 15 },
  house: { label: "What is the numeric house number you chose?", hint: "Use 1 to 10 digits, including any leading zeros.", pattern: "[0-9]{1,10}", maxLength: 10 },
  pin: {
    label: "What is your private recovery PIN?",
    hint: "Use 8 to 16 digits. Choose a PIN you use only for BrewHouse.",
    pattern: "[0-9]{8,16}",
    maxLength: 16,
    resetFormat: { pattern: "[0-9]{4,16}", maxLength: 16, hint: "Enter the exact digits of your saved recovery PIN." },
  },
};

export type RecoveryQuestion = keyof typeof recoveryQuestions;

export function isRecoveryQuestion(value: unknown): value is RecoveryQuestion {
  return typeof value === "string" && Object.hasOwn(recoveryQuestions, value);
}

export function validRecoveryAnswer(question: RecoveryQuestion, value: unknown, resetting = false): value is string {
  const { pattern } = question === "pin" && resetting ? recoveryQuestions.pin.resetFormat : recoveryQuestions[question];
  if (typeof value !== "string" || !new RegExp("^(?:" + pattern + ")(?![\\s\\S])").test(value)) {
    return false;
  }
  if (question !== "dob") return true;

  const date = new Date(value.slice(0, 4) + "-" + value.slice(4, 6) + "-" + value.slice(6) + "T00:00:00Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10).replaceAll("-", "") === value;
}
