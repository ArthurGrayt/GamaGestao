import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';

// Lazy Load Pages
const Login = React.lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Financeiro = React.lazy(() => import('./pages/Financeiro').then(module => ({ default: module.Financeiro })));
const Saude = React.lazy(() => import('./pages/Saude').then(module => ({ default: module.Saude })));
const Operacional = React.lazy(() => import('./pages/Operacional').then(module => ({ default: module.Operacional })));
const Comercial = React.lazy(() => import('./pages/Comercial').then(module => ({ default: module.Comercial })));
const Clientes = React.lazy(() => import('./pages/Clientes').then(module => ({ default: module.Clientes })));
const Usuarios = React.lazy(() => import('./pages/Usuarios').then(module => ({ default: module.Usuarios })));
const Auditoria = React.lazy(() => import('./pages/Auditoria').then(module => ({ default: module.Auditoria })));

// Loading Component
const PageLoader = () => (
  <div className="h-full w-full flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-2">
      <div className="w-8 h-8 rounded-full border-4 border-blue-500/30 border-t-blue-600 animate-spin"></div>
      <span className="text-sm font-medium text-slate-500">Carregando...</span>
    </div>
  </div>
);

function App() {
  return (
    <HashRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="saude" element={<Saude />} />
            <Route path="operacional" element={<Operacional />} />
            <Route path="comercial" element={<Comercial />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="comercial" element={<Comercial />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="auditoria" element={<Auditoria />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default App;