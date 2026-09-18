import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './services/store';
import AppShell from './layouts/AppShell';
import Dashboard from './pages/Dashboard';
import Assessments from './pages/Assessments';
import Targets from './pages/Targets';
import Automation from './pages/Automation';
import Logs from './pages/Logs';
import Hosts from './pages/Hosts';
import HostDetail from './pages/HostDetail';
import Services from './pages/Services';
import NetworkMap from './pages/NetworkMap';
import Vulnerabilities from './pages/Vulnerabilities';
import Findings from './pages/Findings';
import FindingDetail from './pages/FindingDetail';
import Evidence from './pages/Evidence';
import Reports from './pages/Reports';
import Templates from './pages/Templates';
import Analytics from './pages/Analytics';
import ImportCenter from './pages/ImportCenter';
import ExportCenter from './pages/ExportCenter';
import SettingsPage from './pages/Settings';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assessments" element={<Assessments />} />
            <Route path="/targets" element={<Targets />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/hosts" element={<Hosts />} />
            <Route path="/hosts/:id" element={<HostDetail />} />
            <Route path="/services" element={<Services />} />
            <Route path="/network-map" element={<NetworkMap />} />
            <Route path="/vulnerabilities" element={<Vulnerabilities />} />
            <Route path="/findings" element={<Findings />} />
            <Route path="/findings/:id" element={<FindingDetail />} />
            <Route path="/evidence" element={<Evidence />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/import" element={<ImportCenter />} />
            <Route path="/export" element={<ExportCenter />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
}
