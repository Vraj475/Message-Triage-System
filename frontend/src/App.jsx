import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Evaluation from './pages/Evaluation';
import SystemHealth from './pages/SystemHealth';
import UploadPanel from './components/UploadPanel';
import { ToastProvider } from './context/ToastContext';

export default function App() {
  const [datasets, setDatasets] = useState([]);
  const [activeDatasetId, setActiveDatasetId] = useState('');

  useEffect(() => {
    loadDatasets();
  }, []);

  async function loadDatasets() {
    try {
      const res = await axios.get('/api/datasets');
      setDatasets(res.data);
      if (res.data.length > 0 && !activeDatasetId) {
        setActiveDatasetId(res.data[0]._id);
      }
    } catch {}
  }

  function handleSelectDataset(id) {
    setActiveDatasetId(id);
  }

  return (
    <ToastProvider>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        {/* Fixed 240px Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div style={{ flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Header
            datasets={datasets}
            activeDatasetId={activeDatasetId}
            onSelectDataset={handleSelectDataset}
          />

          <main style={{ padding: '24px 28px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard
                    datasets={datasets}
                    activeDatasetId={activeDatasetId}
                    onSelectDataset={handleSelectDataset}
                    onRefreshDatasets={loadDatasets}
                  />
                }
              />
              <Route
                path="/upload"
                element={
                  <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <UploadPanel
                      onUploadComplete={(ds) => {
                        loadDatasets();
                        setActiveDatasetId(ds._id);
                      }}
                    />
                  </div>
                }
              />
              <Route path="/eval" element={<Evaluation />} />
              <Route path="/health" element={<SystemHealth />} />
            </Routes>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
