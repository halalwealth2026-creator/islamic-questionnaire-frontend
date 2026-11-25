import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Questionnaire from './components/Questionnaire';
import ThankYou from './components/ThankYou';

const AdminRoute = lazy(() => import('./admin/ProtectedRoute'));

function PublicQuestionnairePage() {
  const [language, setLanguage] = useState('ta');
  const [submissionInfo, setSubmissionInfo] = useState(null);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const handleSubmitted = (data) => {
    setSubmissionInfo(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="app-container">
      {!submissionInfo ? (
        <Questionnaire
          language={language}
          onLanguageChange={setLanguage}
          onSubmitted={handleSubmitted}
        />
      ) : (
        <ThankYou
          submissionInfo={submissionInfo}
          language={language}
          onLanguageChange={(nextLang) => {
            setLanguage(nextLang);
            setSubmissionInfo((prev) => (prev ? { ...prev, language: nextLang } : prev));
          }}
        />
      )}
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<PublicQuestionnairePage />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="/admin/login" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
