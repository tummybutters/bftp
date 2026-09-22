"use client";
import { useState } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { QuizOptionVisual } from "./quiz-option-visual";
import s from "./contact-quiz.module.css";
export function DeviceCount({
  value,
  onContinue,
}: {
  value: string;
  onContinue: (count: string) => void;
}) {
  const known = /^\d+$/.test(value) && Number(value) > 0;
  const [choice, setChoice] = useState(
    known
      ? Number(value) <= 5
        ? value
        : "More"
      : value === "Not Sure"
        ? "Not sure"
        : "",
  );
  const [exact, setExact] = useState(known && Number(value) > 5 ? value : "");
  return (
    <form
      className={s["device-count"]}
      onSubmit={(e) => {
        e.preventDefault();
        onContinue(
          choice === "More"
            ? exact
              ? String(Number(exact))
              : "Not Sure"
            : choice === "Not sure" || !choice
              ? "Not Sure"
              : choice,
        );
      }}
    >
      <fieldset>
        <legend className={s["sr-only"]}>Number of backflow devices</legend>
        <div className={s["device-options"]}>
          {["1", "2", "3", "4", "5", "More", "Not sure"].map((item) => (
            <label
              className={choice === item ? s.checked : undefined}
              key={item}
            >
              <input
                type="radio"
                name="device-count"
                value={item}
                checked={choice === item}
                onChange={() => setChoice(item)}
              />
              <QuizOptionVisual
                value={item === "Not sure" ? item : "device"}
                compact
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {choice === "More" && (
        <label className={s["exact-count"]}>
          How many?
          <input
            type="number"
            min={1}
            max={100}
            step={1}
            inputMode="numeric"
            placeholder="Number of devices"
            value={exact}
            onChange={(e) => setExact(e.target.value)}
          />
        </label>
      )}
      <button className={s.primary}>
        Continue
        <ArrowRightIcon />
      </button>
    </form>
  );
}
