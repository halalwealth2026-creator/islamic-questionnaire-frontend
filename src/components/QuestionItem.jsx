import React from 'react';
import { UI_TEXT } from '../data/questionnaireConfig';

const QuestionItem = ({
  question,
  language,
  answer,
  otherValue,
  error,
  otherError,
  onChange,
  onOtherChange,
  inputRef,
  otherInputRef
}) => {
  const t = UI_TEXT[language] || UI_TEXT.ta;
  const formattedNumber = String(question.number).padStart(2, '0');
  const inputId = `question-${question.number}`;
  const otherInputId = `question-${question.number}-other`;
  const errorId = `error-${question.number}`;
  const otherErrorId = `error-${question.number}-other`;

  const primaryText = language === 'ta' ? question.question.ta : question.question.en;
  const secondaryText = language === 'ta' ? question.question.en : question.question.ta;
  const showOtherInput = question.type === 'select' && question.allowOther && answer === 'other';

  return (
    <article
      className={`question-card ${error || otherError ? 'has-error' : ''}`}
      id={`card-${question.id}`}
      aria-labelledby={`label-${question.id}`}
    >
      <header className="question-header">
        <span className="question-badge">
          {t.questionLabel} {formattedNumber}
        </span>
        <label
          htmlFor={inputId}
          id={`label-${question.id}`}
          className="question-text"
        >
          {primaryText}
        </label>
        <p className="question-text-secondary">{secondaryText}</p>
      </header>

      <div className="input-wrapper">
        {question.type === 'select' ? (
          <select
            ref={inputRef}
            id={inputId}
            name={question.id}
            value={answer || ''}
            onChange={(e) => onChange(question.id, e.target.value)}
            className={`text-input select-input ${error ? 'input-error' : ''}`}
            aria-required="true"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          >
            <option value="">{t.selectPlaceholder}</option>
            {(question.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label[language]}
              </option>
            ))}
          </select>
        ) : question.type === 'number' ? (
          <input
            ref={inputRef}
            id={inputId}
            name={question.id}
            type="number"
            min={question.min}
            max={question.max}
            value={answer ?? ''}
            onChange={(e) => onChange(question.id, e.target.value)}
            placeholder={t.numberPlaceholder}
            className={`text-input ${error ? 'input-error' : ''}`}
            aria-required="true"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
        ) : question.type === 'text' ? (
          <input
            ref={inputRef}
            id={inputId}
            name={question.id}
            type="text"
            value={answer || ''}
            onChange={(e) => onChange(question.id, e.target.value)}
            placeholder={t.textPlaceholder}
            className={`text-input ${error ? 'input-error' : ''}`}
            aria-required="true"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
        ) : (
          <textarea
            ref={inputRef}
            id={inputId}
            name={question.id}
            value={answer || ''}
            onChange={(e) => onChange(question.id, e.target.value)}
            placeholder={t.textareaPlaceholder}
            rows={4}
            className={`question-textarea ${error ? 'input-error' : ''}`}
            aria-required="true"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
        )}

        {error && (
          <p id={errorId} className="validation-message" role="alert">
            <span className="error-icon" aria-hidden="true">!</span>
            {error}
          </p>
        )}
      </div>

      {showOtherInput && (
        <div className="followup-box" id={`card-${question.id}-other`}>
          <label htmlFor={otherInputId} className="followup-label">
            {t.otherLabel}
          </label>
          <div className="input-wrapper">
            <input
              ref={otherInputRef}
              id={otherInputId}
              name={`${question.id}_other`}
              type="text"
              value={otherValue || ''}
              onChange={(e) => onOtherChange(question.id, e.target.value)}
              placeholder={t.otherPlaceholder}
              className={`text-input ${otherError ? 'input-error' : ''}`}
              aria-required="true"
              aria-invalid={Boolean(otherError)}
              aria-describedby={otherError ? otherErrorId : undefined}
            />
            {otherError && (
              <p id={otherErrorId} className="validation-message" role="alert">
                <span className="error-icon" aria-hidden="true">!</span>
                {otherError}
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  );
};

export default QuestionItem;
