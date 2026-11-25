import React from 'react';
import { UI_TEXT } from '../data/questionnaireConfig';

const ThankYou = ({ submissionInfo, language = 'ta', onLanguageChange }) => {
  const activeLang = submissionInfo?.language || language;
  const t = UI_TEXT[activeLang] || UI_TEXT.ta;

  const formattedTime = submissionInfo?.submittedAt
    ? new Date(submissionInfo.submittedAt).toLocaleString(activeLang === 'ta' ? 'ta-IN' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  return (
    <div className="page-wrapper">
      {onLanguageChange && (
        <div className="language-bar">
          <div className="language-switcher" role="group" aria-label="Language switcher">
            <button
              type="button"
              className={`lang-btn ${activeLang === 'ta' ? 'active' : ''}`}
              onClick={() => onLanguageChange('ta')}
            >
              தமிழ்
            </button>
            <button
              type="button"
              className={`lang-btn ${activeLang === 'en' ? 'active' : ''}`}
              onClick={() => onLanguageChange('en')}
            >
              English
            </button>
          </div>
        </div>
      )}

      <section className="thank-you-container" aria-live="polite">
        <div className="thank-you-card">
          <div className="accent-mark" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="#C2A56A" strokeWidth="2" />
              <path
                d="M13 20.5L17.5 25L27 15.5"
                stroke="#C2A56A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="thank-you-title">{t.thankYouTitle}</h1>
          <p className="thank-you-text">{t.thankYouText}</p>
          <p className="thank-you-subtext">{t.thankYouSubtext}</p>

          {submissionInfo?.submissionId && (
            <div className="submission-receipt">
              <div className="receipt-row">
                <span>{t.receiptIdLabel}</span>
                <code>{submissionInfo.submissionId}</code>
              </div>
              {formattedTime && (
                <div className="receipt-row">
                  <span>{t.receiptDateLabel}</span>
                  <span>{formattedTime}</span>
                </div>
              )}
              <div className="receipt-row">
                <span>{t.receiptLanguageLabel}</span>
                <span>{t.languageName}</span>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ThankYou;
