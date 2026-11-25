import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  exportAdminResponsesCsv,
  fetchAdminDashboard,
  fetchAdminResponseDetail,
  fetchAdminResponses
} from '../api/apiClient';
import { clearAdminSession, getAdminEmail, getAdminToken } from './auth';
import '../styles/admin.css';

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderLanguageLabel(lang) {
  return lang === 'en' ? 'English (EN)' : 'தமிழ் (TA)';
}

const PAGE_SIZE = 15;

const AdminDashboard = ({ onLoggedOut }) => {
  const navigate = useNavigate();
  const [token] = useState(() => getAdminToken());
  const adminEmail = getAdminEmail();

  const [stats, setStats] = useState({
    totalSubmissions: 0,
    todaySubmissions: 0,
    tamilCount: 0,
    englishCount: 0,
    latestSubmissionAt: null
  });
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');

  const [questionViewMode, setQuestionViewMode] = useState('both');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Admin Dashboard | Islamic Questionnaire';
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleUnauthorized = useCallback(
    (err) => {
      if (err?.status === 401) {
        clearAdminSession();
        if (onLoggedOut) onLoggedOut();
        else navigate('/admin', { replace: true });
        return true;
      }
      return false;
    },
    [navigate, onLoggedOut]
  );

  const loadDashboard = useCallback(async () => {
    if (!token) {
      if (onLoggedOut) onLoggedOut();
      else navigate('/admin', { replace: true });
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [dashboardData, listData] = await Promise.all([
        fetchAdminDashboard(token),
        fetchAdminResponses(token, {
          page,
          limit: PAGE_SIZE,
          search: debouncedSearch,
          startDate,
          endDate,
          language: languageFilter
        })
      ]);

      setStats({
        totalSubmissions: dashboardData.totalSubmissions ?? dashboardData.total ?? 0,
        todaySubmissions: dashboardData.todaySubmissions ?? dashboardData.today ?? 0,
        tamilCount: dashboardData.tamilCount ?? 0,
        englishCount: dashboardData.englishCount ?? 0,
        latestSubmissionAt: dashboardData.latestSubmissionAt || null
      });
      setItems(listData.items || []);
      setTotal(listData.total ?? 0);
      setPages(Math.max(1, listData.pages ?? 1));
    } catch (err) {
      if (!handleUnauthorized(err)) {
        setError(err.message || 'Unable to load questionnaire responses.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, page, debouncedSearch, startDate, endDate, languageFilter, handleUnauthorized, navigate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!selected) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected]);

  const handleViewDetails = async (submissionId) => {
    setDetailLoading(true);
    setError('');
    try {
      const detail = await fetchAdminResponseDetail(token, submissionId);
      setSelected(detail);
    } catch (err) {
      if (!handleUnauthorized(err)) {
        setError(err.message || 'Unable to load submission details.');
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    setError('');
    try {
      const blob = await exportAdminResponsesCsv(token, {
        search: debouncedSearch,
        startDate,
        endDate,
        language: languageFilter
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `questionnaire-responses-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (!handleUnauthorized(err)) {
        setError(err.message || 'Unable to export CSV.');
      }
    } finally {
      setExporting(false);
    }
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setStartDate('');
    setEndDate('');
    setLanguageFilter('');
    setPage(1);
  };

  const handleLogout = () => {
    clearAdminSession();
    if (onLoggedOut) onLoggedOut();
    else navigate('/admin', { replace: true });
  };

  const hasFilters = Boolean(searchInput.trim() || startDate || endDate || languageFilter);
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(total, page * PAGE_SIZE);

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <div className="admin-brand">
            <div className="admin-brand-mark" aria-hidden="true">Q</div>
            <div>
              <p className="admin-eyebrow">ADMINISTRATION CONSOLE</p>
              <h1 className="admin-topbar-title">Questionnaire Responses</h1>
            </div>
          </div>

          <div className="admin-topbar-actions">
            {adminEmail && <span className="admin-user-pill">{adminEmail}</span>}
            <button type="button" className="admin-btn-ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        {error && (
          <div className="admin-alert" role="alert">
            {error}
          </div>
        )}

        <section className="admin-stats-grid" aria-label="Submission Statistics">
          <article className="admin-stat-card">
            <span className="admin-stat-label">Total Submissions</span>
            <strong className="admin-stat-value">{stats.totalSubmissions.toLocaleString()}</strong>
            <span className="admin-stat-hint">All-time stored responses</span>
          </article>

          <article className="admin-stat-card">
            <span className="admin-stat-label">Submitted Today</span>
            <strong className="admin-stat-value">{stats.todaySubmissions.toLocaleString()}</strong>
            <span className="admin-stat-hint">Since midnight local time</span>
          </article>

          <article className="admin-stat-card">
            <span className="admin-stat-label">Languages Used</span>
            <strong className="admin-stat-value admin-stat-date">
              TA: {stats.tamilCount} &middot; EN: {stats.englishCount}
            </strong>
            <span className="admin-stat-hint">Tamil vs. English submissions</span>
          </article>

          <article className="admin-stat-card">
            <span className="admin-stat-label">Latest Submission</span>
            <strong className="admin-stat-value admin-stat-date">
              {formatDateTime(stats.latestSubmissionAt)}
            </strong>
            <span className="admin-stat-hint">Most recent response</span>
          </article>
        </section>

        <section className="admin-panel" aria-label="Submissions List">
          <div className="admin-panel-header">
            <div>
              <h2>All Submissions</h2>
              <p>Search by participant, ID, or answers; filter by language or date; or export CSV/Excel.</p>
            </div>

            <div className="admin-panel-buttons">
              <button type="button" className="admin-btn-ghost" onClick={loadDashboard} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                onClick={handleExportCsv}
                disabled={exporting || total === 0}
              >
                {exporting ? 'Exporting...' : 'Export CSV / Excel'}
              </button>
            </div>
          </div>

          <div className="admin-toolbar">
            <div className="admin-search-wrap">
              <label htmlFor="admin-search" className="sr-only">Search submissions</label>
              <input
                id="admin-search"
                type="search"
                className="admin-input admin-search-input"
                placeholder="Search by name, email, phone, submission ID, or answers..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <div className="admin-date-filters">
              <label className="admin-date-label">
                <span>Language</span>
                <select
                  className="admin-input admin-lang-select"
                  value={languageFilter}
                  onChange={(e) => {
                    setLanguageFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All</option>
                  <option value="ta">தமிழ் (TA)</option>
                  <option value="en">English (EN)</option>
                </select>
              </label>

              <label className="admin-date-label">
                <span>From</span>
                <input
                  type="date"
                  className="admin-input admin-date-input"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                />
              </label>

              <label className="admin-date-label">
                <span>To</span>
                <input
                  type="date"
                  className="admin-input admin-date-input"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                />
              </label>

              {hasFilters && (
                <button type="button" className="admin-btn-ghost" onClick={handleClearFilters}>
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Phone</th>
                  <th>Language</th>
                  <th>Submission ID</th>
                  <th>Submitted Date &amp; Time</th>
                  <th className="admin-col-action">Details</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.submissionId}>
                    <td>
                      <strong className="admin-participant-name">
                        {item.basicInfo?.name || '—'}
                      </strong>
                      <span className="admin-participant-email">
                        {item.basicInfo?.email || '—'}
                      </span>
                    </td>
                    <td>{item.basicInfo?.phone || '—'}</td>
                    <td>
                      <span className={`admin-lang-badge ${item.language === 'en' ? 'lang-en' : 'lang-ta'}`}>
                        {renderLanguageLabel(item.language)}
                      </span>
                    </td>
                    <td>
                      <code className="admin-code-pill">{item.submissionId}</code>
                    </td>
                    <td>{formatDateTime(item.submittedAt || item.createdAt)}</td>
                    <td className="admin-col-action">
                      <button
                        type="button"
                        className="admin-view-btn"
                        onClick={() => handleViewDetails(item.submissionId)}
                        disabled={detailLoading}
                      >
                        View Answers
                      </button>
                    </td>
                  </tr>
                ))}

                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="admin-empty-row">
                      {hasFilters
                        ? 'No submissions match your search or date filters.'
                        : 'No questionnaire submissions found yet.'}
                    </td>
                  </tr>
                )}

                {loading && items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="admin-empty-row">
                      Loading submissions...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <span className="admin-pagination-info">
              Showing {rangeStart}–{rangeEnd} of {total.toLocaleString()} submission{total === 1 ? '' : 's'}
            </span>
            <div className="admin-pagination-buttons">
              <button
                type="button"
                className="admin-btn-ghost"
                disabled={page <= 1 || loading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </button>
              <span className="admin-page-indicator">
                Page {page} of {pages}
              </span>
              <button
                type="button"
                className="admin-btn-ghost"
                disabled={page >= pages || loading}
                onClick={() => setPage((prev) => Math.min(pages, prev + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>

      {selected && (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <section
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submission-modal-title"
          >
            <header className="admin-modal-header">
              <div>
                <p className="admin-eyebrow">SUBMISSION DETAILS</p>
                <h2 id="submission-modal-title">
                  {selected.basicInfo?.name || selected.submissionId}
                </h2>
                <p className="admin-modal-contact">
                  {selected.basicInfo?.email || '—'} &middot; {selected.basicInfo?.phone || '—'}
                </p>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                aria-label="Close submission details"
                onClick={() => setSelected(null)}
              >
                &times;
              </button>
            </header>

            <div className="admin-modal-meta">
              <div>
                <span className="admin-meta-label">Submission ID</span>
                <code className="admin-code-pill">{selected.submissionId}</code>
              </div>
              <div>
                <span className="admin-meta-label">Language</span>
                <span className={`admin-lang-badge ${selected.language === 'en' ? 'lang-en' : 'lang-ta'}`}>
                  {renderLanguageLabel(selected.language)}
                </span>
              </div>
              <div>
                <span className="admin-meta-label">Submitted At</span>
                <span>{formatDateTime(selected.submittedAt || selected.createdAt)}</span>
              </div>
            </div>

            <div className="admin-display-toggle-bar">
              <span className="admin-meta-label">Question Display:</span>
              <div className="admin-display-pills" role="group" aria-label="Question display language">
                <button
                  type="button"
                  className={`admin-pill-btn ${questionViewMode === 'both' ? 'active' : ''}`}
                  onClick={() => setQuestionViewMode('both')}
                >
                  Both (தமிழ் + English)
                </button>
                <button
                  type="button"
                  className={`admin-pill-btn ${questionViewMode === 'ta' ? 'active' : ''}`}
                  onClick={() => setQuestionViewMode('ta')}
                >
                  தமிழ் Only
                </button>
                <button
                  type="button"
                  className={`admin-pill-btn ${questionViewMode === 'en' ? 'active' : ''}`}
                  onClick={() => setQuestionViewMode('en')}
                >
                  English Only
                </button>
              </div>
            </div>

            <div className="admin-modal-answers">
              {Array.isArray(selected.answers) && selected.answers.length > 0 ? (
                selected.answers.map((entry) => {
                  const showDualLabels =
                    !entry.isOther &&
                    entry.answerLabelTa &&
                    entry.answerLabelEn &&
                    entry.answerLabelTa !== entry.answerLabelEn;

                  return (
                    <article key={entry.questionId} className="admin-answer-item">
                      <div className="admin-answer-head">
                        <span className="admin-answer-badge">
                          QUESTION {String(entry.number).padStart(2, '0')}
                        </span>
                        {entry.isOther && (
                          <span className="admin-original-num">
                            Custom &ldquo;Other&rdquo; Response
                          </span>
                        )}
                      </div>

                      {(questionViewMode === 'both' || questionViewMode === 'ta') && (
                        <h3 className="admin-q-ta">{entry.questionTa}</h3>
                      )}
                      {(questionViewMode === 'both' || questionViewMode === 'en') && (
                        <p className="admin-q-en">{entry.questionEn}</p>
                      )}

                      <div className="admin-answer-box">
                        <span className="admin-answer-label-tag">
                          {entry.isOther
                            ? `Other / மற்றவை — Custom Answer (${selected.language === 'en' ? 'English' : 'Tamil'}):`
                            : `Submitted Answer (${selected.language === 'en' ? 'English' : 'Tamil'}):`}
                        </span>
                        <p className="admin-answer-text">
                          {entry.isOther && entry.otherText
                            ? entry.otherText
                            : entry.answerText || String(entry.answer)}
                        </p>

                        {showDualLabels && (
                          <p className="admin-answer-bilingual-hint">
                            <span>தமிழ்: {entry.answerLabelTa}</span>
                            <span>English: {entry.answerLabelEn}</span>
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })
              ) : (
                (selected.responses || []).map((entry) => (
                  <article key={entry.id} className="admin-answer-item">
                    <span className="admin-answer-badge">
                      QUESTION {String(entry.id).padStart(2, '0')}
                    </span>
                    <h3 className="admin-q-ta">{entry.question}</h3>
                    <div className="admin-answer-box">
                      <p className="admin-answer-text">{entry.answer}</p>
                    </div>
                  </article>
                ))
              )}
            </div>

            <footer className="admin-modal-footer">
              <button type="button" className="admin-btn-primary" onClick={() => setSelected(null)}>
                Close Details
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
