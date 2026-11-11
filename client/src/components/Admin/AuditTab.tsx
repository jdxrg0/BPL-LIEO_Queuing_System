import React, { useEffect, useState } from 'react';
import { api } from '../../api';

export default function AuditTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await api.getAuditLogs();
      setLogs(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-muted">Loading audit logs...</div>;
  if (error) return <div className="p-8 text-center text-danger">{error}</div>;

  return (
    <div className="card bg-surface border border-border rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="m-0 text-xl font-bold text-text-main">System Audit Log</h2>
        <button onClick={fetchLogs} className="btn btn-primary px-4 py-2 rounded-lg text-sm font-semibold">
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/50 text-text-muted text-sm uppercase tracking-wider">
              <th className="p-3 font-semibold">Timestamp</th>
              <th className="p-3 font-semibold">Ticket ID</th>
              <th className="p-3 font-semibold">From → To</th>
              <th className="p-3 font-semibold">Performed By</th>
              <th className="p-3 font-semibold">Note</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-muted">No audit logs found.</td>
              </tr>
            ) : (
              logs.map((log: any) => (
                <tr key={log.id} className="border-b border-border/20 hover:bg-black/5 transition-colors">
                  <td className="p-3 text-sm text-text-main whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 text-sm font-semibold text-text-main">#{log.ticketId}</td>
                  <td className="p-3 text-sm">
                    <span className="text-text-muted">{log.fromStatus || '—'}</span>
                    <span className="mx-2 text-text-muted">→</span>
                    <span className="font-semibold text-primary">{log.toStatus}</span>
                  </td>
                  <td className="p-3 text-sm text-text-muted">{log.performedBy || 'System'}</td>
                  <td className="p-3 text-sm text-text-muted">{log.note || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
