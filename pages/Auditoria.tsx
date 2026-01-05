import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { LogTable } from '../components/audit/LogTable';
import { LogFilters } from '../components/audit/LogFilters';
import { LogDetailsModal } from '../components/audit/LogDetailsModal';
import { ShieldCheck } from 'lucide-react';

interface Log {
    id: number;
    timelog: string;
    appname: string;
    action: string;
    logtxt: string;
    user_uuid: string;
    users?: {
        username: string;
        img_url: string | null;
    };
}

export const Auditoria: React.FC = () => {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);

    // State for filters
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
    const [selectedApp, setSelectedApp] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');
    const [selectedDate, setSelectedDate] = useState('');

    const [selectedLog, setSelectedLog] = useState<Log | null>(null);

    useEffect(() => {
        // Debounce search text to avoid too many requests
        const timer = setTimeout(() => {
            fetchLogs();
        }, 300);

        return () => clearTimeout(timer);
    }, [selectedUser, selectedOperation, selectedApp, searchText, selectedDate]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('logs')
                .select(`
          *,
          users:user_uuid (
            username,
            img_url
          )
        `)
                .order('timelog', { ascending: false })
                .limit(100);

            // Apply Filters
            if (selectedUser) {
                query = query.eq('user_uuid', selectedUser.user_id);
            }

            if (selectedOperation) {
                query = query.eq('action', selectedOperation);
            }

            if (selectedApp) {
                query = query.eq('appname', selectedApp);
            }

            if (searchText) {
                query = query.ilike('logtxt', `%${searchText}%`);
            }

            if (selectedDate) {
                // Filter by specific day (00:00:00 to 23:59:59)
                query = query
                    .gte('timelog', `${selectedDate}T00:00:00`)
                    .lte('timelog', `${selectedDate}T23:59:59`);
            }

            const { data, error } = await query;

            if (error) throw error;
            if (data) setLogs(data);

        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck className="text-blue-600" size={28} />
                        Auditoria e Logs
                    </h1>
                    <p className="text-slate-500 mt-1">Monitore as atividades e registros de segurança do sistema.</p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {/* Filters */}
                <LogFilters
                    selectedUser={selectedUser}
                    onUserSelect={setSelectedUser}
                    selectedOperation={selectedOperation}
                    onOperationSelect={setSelectedOperation}
                    selectedApp={selectedApp}
                    onAppSelect={setSelectedApp}
                    searchText={searchText}
                    onSearchTextChange={setSearchText}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                />

                {/* Table */}
                <LogTable
                    logs={logs}
                    loading={loading}
                    onRowClick={setSelectedLog}
                />
            </div>

            {/* Details Modal */}
            <LogDetailsModal
                log={selectedLog}
                isOpen={!!selectedLog}
                onClose={() => setSelectedLog(null)}
            />
        </div>
    );
};

export default Auditoria;
