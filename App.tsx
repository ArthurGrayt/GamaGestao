import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Financeiro } from './pages/Financeiro';
import { Saude } from './pages/Saude';
import { Operacional } from './pages/Operacional';
import { Comercial } from './pages/Comercial';
import { Clientes } from './pages/Clientes';
import { GamaTalk } from './pages/GamaTalk';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="financeiro" element={<Financeiro />} />
          <Route path="saude" element={<Saude />} />
          <Route path="operacional" element={<Operacional />} />
          <Route path="operacional" element={<Operacional />} />
          <Route path="comercial" element={<Comercial />} />
          <Route path="gama-talk" element={<GamaTalk />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;