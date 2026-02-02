import React from 'react';
import { Beaker } from 'lucide-react';

export const Teste: React.FC = () => {
    return (
        <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl shadow-sm border border-white/50 backdrop-blur-sm">
                    <Beaker size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Área de Teste</h2>
                    <p className="text-slate-500">Espaço reservado para validações e novas funcionalidades em desenvolvimento.</p>
                </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/50 min-h-[400px] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <Beaker size={32} />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Ambiente de Teste Inicializado</h3>
                <p className="text-sm text-slate-500 max-w-sm">
                    Este é um componente placeholder. Use este espaço para testar novos quadrantes, layouts ou integrações com o banco de dados.
                </p>
            </div>
        </div>
    );
};
