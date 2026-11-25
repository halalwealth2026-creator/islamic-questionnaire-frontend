import React, { useRef, useState } from 'react';
import { QUESTIONS, UI_TEXT } from '../data/questionnaireConfig';
import QuestionItem from './QuestionItem';
import { submitQuestionnaire } from '../api/apiClient';

const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const STRICT_PHONE_REGEX = /^\d{10}$/;

function resolveErrorText(errorSpec, language) {
  if (!errorSpec) return '';
  const errors = UI_TEXT[language]?.errors || UI_TEXT.ta.errors;
  if (errorSpec.key === 'numberRange') {
    return errors.numberRange(errorSpec.min, errorSpec.max);
  }
  return errors[errorSpec.key] || '';
}

function validateQuestion(question, rawValue, rawOtherValue) {
  if (question.type === 'select') {
    const selected = typeof rawValue === 'string' ? rawValue.trim() : '';
    if (!selected) {
      return { primaryError: { key: 'requiredSelect' }, otherError: null };
    }
    if (question.allowOther && selected === 'other') {
      const trimmedOther = typeof rawOtherValue === 'string' ? rawOtherValue.trim() : '';
      if (!trimmedOther) {
        return { primaryError: null, otherError: { key: 'requiredOther' } };
      }
      if (trimmedOther.length > 10000) {
        return { primaryError: null, otherError: { key: 'maxLength' } };
      }
    }
    return { primaryError: null, otherError: null };
  }

  if (question.type === 'number') {
    if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
      return { primaryError: { key: 'requiredAnswer' }, otherError: null };
    }
    const num = Number(rawValue);
    const min = question.min ?? 1;
    const max = question.max ?? 120;
    if (!Number.isFinite(num) || num < min || num > max) {
      return { primaryError: { key: 'numberRange', min, max }, otherError: null };
    }
    return { primaryError: null, otherError: null };
  }

  const trimmed = typeof rawValue === 'string' ? rawValue.trim() : '';
  if (!trimmed) {
    return { primaryError: { key: 'requiredAnswer' }, otherError: null };
  }
  if (trimmed.length > 10000) {
    return { primaryError: { key: 'maxLength' }, otherError: null };
  }
  return { primaryError: null, otherError: null };
}

const Questionnaire = ({ language, onLanguageChange, onSubmitted }) => {
  const t = UI_TEXT[language] || UI_TEXT.ta;

  const [currentPage, setCurrentPage] = useState('info'); // 'info' | 'questions'
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [basicInfoErrors, setBasicInfoErrors] = useState({});

  const [answers, setAnswers] = useState({});
  const [otherAnswers, setOtherAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [otherErrors, setOtherErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submittingRef = useRef(false);
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const inputRefs = useRef({});
  const otherInputRefs = useRef({});

  const handleBasicInfoChange = (field, value) => {
    const nextValue =
      field === 'phone' ? value.replace(/[^0-9]/g, '').slice(0, 10) : value;

    setBasicInfo((prev) => ({
      ...prev,
      [field]: nextValue
    }));

    if (basicInfoErrors[field]) {
      setBasicInfoErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateParticipantInfo = () => {
    const validationErrors = {};
    const trimmedName = basicInfo.name.trim();
    const trimmedEmail = basicInfo.email.trim();
    const rawPhone = basicInfo.phone;

    if (!trimmedName) {
      validationErrors.name = { key: 'nameRequired' };
    } else if (trimmedName.length > 120) {
      validationErrors.name = { key: 'nameMax' };
    }

    if (!trimmedEmail) {
      validationErrors.email = { key: 'emailRequired' };
    } else if (
      trimmedEmail.length > 254 ||
      trimmedEmail.includes('..') ||
      !STRICT_EMAIL_REGEX.test(trimmedEmail)
    ) {
      validationErrors.email = { key: 'emailInvalid' };
    }

    if (!rawPhone || rawPhone.length === 0) {
      validationErrors.phone = { key: 'phoneRequired' };
    } else if (!STRICT_PHONE_REGEX.test(rawPhone)) {
      validationErrors.phone = { key: 'phoneInvalid' };
    }

    if (Object.keys(validationErrors).length > 0) {
      setBasicInfoErrors(validationErrors);
      if (validationErrors.name && nameInputRef.current) {
        nameInputRef.current.focus();
      } else if (validationErrors.email && emailInputRef.current) {
        emailInputRef.current.focus();
      } else if (validationErrors.phone && phoneInputRef.current) {
        phoneInputRef.current.focus();
      }
      return false;
    }

    setBasicInfoErrors({});
    return true;
  };

  const handleProceed = (e) => {
    if (e) e.preventDefault();
    if (!validateParticipantInfo()) return;
    setCurrentPage('questions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnswerChange = (id, value) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: value
    }));

    if (value !== 'other') {
      setOtherAnswers((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setOtherErrors((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }

    if (errors[id]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
    if (formError) {
      setFormError(null);
    }
  };

  const handleOtherChange = (id, value) => {
    setOtherAnswers((prev) => ({
      ...prev,
      [id]: value
    }));

    if (otherErrors[id]) {
      setOtherErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
    if (formError) {
      setFormError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || submittingRef.current) return;

    if (!validateParticipantInfo()) {
      setCurrentPage('info');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const validationErrors = {};
    const validationOtherErrors = {};
    let firstInvalidTarget = null;

    for (const q of QUESTIONS) {
      const { primaryError, otherError } = validateQuestion(
        q,
        answers[q.id],
        otherAnswers[q.id]
      );

      if (primaryError) {
        validationErrors[q.id] = primaryError;
        if (!firstInvalidTarget) {
          firstInvalidTarget = { id: q.id, isOther: false };
        }
      }
      if (otherError) {
        validationOtherErrors[q.id] = otherError;
        if (!firstInvalidTarget) {
          firstInvalidTarget = { id: q.id, isOther: true };
        }
      }
    }

    if (firstInvalidTarget) {
      setErrors(validationErrors);
      setOtherErrors(validationOtherErrors);
      setFormError({ key: 'fixErrors' });

      const targetCard = document.getElementById(
        firstInvalidTarget.isOther
          ? `card-${firstInvalidTarget.id}-other`
          : `card-${firstInvalidTarget.id}`
      );
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const targetInput = firstInvalidTarget.isOther
        ? otherInputRefs.current[firstInvalidTarget.id]
        : inputRefs.current[firstInvalidTarget.id];
      if (targetInput && typeof targetInput.focus === 'function') {
        setTimeout(() => targetInput.focus(), 250);
      }
      return;
    }

    setErrors({});
    setOtherErrors({});
    setFormError(null);
    setSubmitError('');
    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const payload = {
        language,
        basicInfo: {
          name: basicInfo.name.trim(),
          email: basicInfo.email.trim().toLowerCase(),
          phone: basicInfo.phone
        },
        answers: QUESTIONS.map((q) => {
          if (q.type === 'select') {
            const selected = String(answers[q.id] ?? '').trim();
            return {
              questionId: q.id,
              answer: selected,
              ...(selected === 'other'
                ? { otherText: String(otherAnswers[q.id] ?? '').trim() }
                : {})
            };
          }
          return {
            questionId: q.id,
            answer:
              q.type === 'number'
                ? Number(answers[q.id])
                : String(answers[q.id] ?? '').trim()
          };
        })
      };

      const result = await submitQuestionnaire(payload);

      if (onSubmitted) {
        onSubmitted({
          submissionId: result.submissionId,
          submittedAt: result.submittedAt,
          language: result.language || language
        });
      }
    } catch (err) {
      setSubmitError(err.message || t.errors.submitFailed);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="language-bar">
        <div className="language-switcher" role="group" aria-label={t.languageLabel}>
          <button
            type="button"
            className={`lang-btn ${language === 'ta' ? 'active' : ''}`}
            onClick={() => onLanguageChange('ta')}
            aria-pressed={language === 'ta'}
          >
            தமிழ்
          </button>
          <button
            type="button"
            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => onLanguageChange('en')}
            aria-pressed={language === 'en'}
          >
            English
          </button>
        </div>
      </div>

      {currentPage === 'info' ? (
        <section className="intro-section" aria-label={t.participantTitle}>
          <div className="intro-content">
            <div className="intro-accent-line" aria-hidden="true" />
            <h1 className="intro-title">{t.siteTitle}</h1>
            <p className="intro-description">{t.siteDescription}</p>

            <div className="basic-info-container">
              <h2 className="basic-info-subtitle">{t.participantTitle}</h2>

              <form onSubmit={handleProceed} noValidate className="basic-info-form">
                <div className="field-group">
                  <label htmlFor="participant-name" className="field-label">
                    {t.fullNameLabel}
                  </label>
                  <div className="input-wrapper">
                    <input
                      ref={nameInputRef}
                      id="participant-name"
                      type="text"
                      value={basicInfo.name}
                      onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                      placeholder={t.fullNamePlaceholder}
                      className={`text-input ${basicInfoErrors.name ? 'input-error' : ''}`}
                      aria-required="true"
                      aria-invalid={Boolean(basicInfoErrors.name)}
                    />
                    {basicInfoErrors.name && (
                      <p className="validation-message" role="alert">
                        <span className="error-icon" aria-hidden="true">!</span>
                        {resolveErrorText(basicInfoErrors.name, language)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="field-group">
                  <label htmlFor="participant-email" className="field-label">
                    {t.emailLabel}
                  </label>
                  <div className="input-wrapper">
                    <input
                      ref={emailInputRef}
                      id="participant-email"
                      type="email"
                      value={basicInfo.email}
                      onChange={(e) => handleBasicInfoChange('email', e.target.value)}
                      placeholder={t.emailPlaceholder}
                      className={`text-input ${basicInfoErrors.email ? 'input-error' : ''}`}
                      aria-required="true"
                      aria-invalid={Boolean(basicInfoErrors.email)}
                    />
                    {basicInfoErrors.email && (
                      <p className="validation-message" role="alert">
                        <span className="error-icon" aria-hidden="true">!</span>
                        {resolveErrorText(basicInfoErrors.email, language)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="field-group">
                  <label htmlFor="participant-phone" className="field-label">
                    {t.phoneLabel}
                  </label>
                  <div className="input-wrapper">
                    <input
                      ref={phoneInputRef}
                      id="participant-phone"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      autoComplete="tel-national"
                      value={basicInfo.phone}
                      onChange={(e) => handleBasicInfoChange('phone', e.target.value)}
                      placeholder={t.phonePlaceholder}
                      className={`text-input ${basicInfoErrors.phone ? 'input-error' : ''}`}
                      aria-required="true"
                      aria-invalid={Boolean(basicInfoErrors.phone)}
                    />
                    {basicInfoErrors.phone && (
                      <p className="validation-message" role="alert">
                        <span className="error-icon" aria-hidden="true">!</span>
                        {resolveErrorText(basicInfoErrors.phone, language)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="basic-info-action">
                  <button type="submit" className="btn-start">
                    {t.continueButton}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      ) : (
        <section id="questionnaire-section" className="questionnaire-section" aria-label={t.siteTitle}>
          <div className="intro-section compact-intro">
            <div className="intro-accent-line" aria-hidden="true" />
            <h1 className="intro-title">{t.siteTitle}</h1>
            <p className="intro-description">{t.questionsDescription}</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="questionnaire-form">
            {formError && (
              <div className="section-error-banner" role="alert">
                <span className="error-icon" aria-hidden="true">!</span>
                {resolveErrorText(formError, language)}
              </div>
            )}

            <div className="questions-container">
              {QUESTIONS.map((q) => (
                <QuestionItem
                  key={q.id}
                  question={q}
                  language={language}
                  answer={answers[q.id]}
                  otherValue={otherAnswers[q.id]}
                  error={resolveErrorText(errors[q.id], language)}
                  otherError={resolveErrorText(otherErrors[q.id], language)}
                  inputRef={(el) => {
                    inputRefs.current[q.id] = el;
                  }}
                  otherInputRef={(el) => {
                    otherInputRefs.current[q.id] = el;
                  }}
                  onChange={handleAnswerChange}
                  onOtherChange={handleOtherChange}
                />
              ))}
            </div>

            {submitError && (
              <div className="section-error-banner submit-error-banner" role="alert">
                <span className="error-icon" aria-hidden="true">!</span>
                {submitError}
              </div>
            )}

            <div className="wizard-nav">
              <button
                type="button"
                className="secondary-action-btn"
                onClick={() => {
                  setCurrentPage('info');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={isSubmitting}
              >
                {t.backToInfoButton}
              </button>

              <button type="submit" className="btn-submit" disabled={isSubmitting}>
                {isSubmitting ? t.submittingButton : t.submitButton}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
};

export default Questionnaire;
