import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface SystemStatusProps {
    isExpanded?: boolean;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ isExpanded = false }) => {
    const [status] = useState<'online' | 'unstable' | 'offline'>('online');
    const [details] = useState({
        uptime: '99.9%',
        lastDowntime: 'Nenhum nos últimos 30 dias',
        maintenance: null as string | null,
        responseTime: '45ms'
    });
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const iconRef = useRef<HTMLDivElement>(null);

    const statusConfig = {
        online: {
            color: 'bg-emerald-500',
            ringColor: 'ring-emerald-200',
            hoverColor: 'hover:bg-emerald-400',
            icon: <Wifi size={16} />,
            label: 'Online',
            textColor: 'text-emerald-600'
        },
        unstable: {
            color: 'bg-yellow-500',
            ringColor: 'ring-yellow-200',
            hoverColor: 'hover:bg-yellow-400',
            icon: <AlertTriangle size={16} />,
            label: 'Instável',
            textColor: 'text-yellow-600'
        },
        offline: {
            color: 'bg-red-500',
            ringColor: 'ring-red-200',
            hoverColor: 'hover:bg-red-400',
            icon: <WifiOff size={16} />,
            label: 'Offline',
            textColor: 'text-red-600'
        }
    };

    const config = statusConfig[status];

    const handleMouseEnter = () => {
        if (iconRef.current) {
            const rect = iconRef.current.getBoundingClientRect();
            setTooltipPos({
                top: rect.top + rect.height / 2,
                left: rect.right + 12
            });
        }
        setShowTooltip(true);
    };

    const handleMouseLeave = () => {
        setShowTooltip(false);
    };

    const tooltipContent = (
        <div
            className="fixed bg-slate-900 text-white rounded-xl p-4 w-64 shadow-2xl z-[9999] pointer-events-none"
            style={{
                top: tooltipPos.top,
                left: tooltipPos.left,
                transform: 'translateY(-50%)'
            }}
        >
            {/* Arrow */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-900 rotate-45"></div>

            {/* Content */}
            <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-60">Status do Sistema</span>
                    <span className={`text-xs font-bold ${config.textColor} bg-white/10 px-2 py-0.5 rounded-full`}>
                        {config.label}
                    </span>
                </div>

                <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                        <span className="opacity-60">Disponibilidade</span>
                        <span className="font-bold">{details.uptime}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="opacity-60">Tempo de Resposta</span>
                        <span className="font-bold">{details.responseTime}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="opacity-60">Última Queda</span>
                        <span className="font-bold text-emerald-400">{details.lastDowntime}</span>
                    </div>
                    {details.maintenance && (
                        <div className="mt-2 p-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                            <p className="text-yellow-300 font-medium text-[10px] uppercase tracking-wider mb-1">⚠️ Manutenção Agendada</p>
                            <p className="text-white text-[11px]">{details.maintenance}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Icon Button */}
            <div
                ref={iconRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`w-8 h-8 rounded-full ${config.color} ${config.hoverColor} flex items-center justify-center text-white cursor-pointer transition-all duration-300 ring-2 ${config.ringColor} shadow-md relative`}
            >
                {status === 'online' && (
                    <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30"></div>
                )}
                <div className="relative z-10">{config.icon}</div>
            </div>

            {/* Portal Tooltip - renders outside sidebar */}
            {showTooltip && createPortal(tooltipContent, document.body)}
        </>
    );
};
