import React, { useEffect, useState } from 'react';
import { X, MonitorPlay } from 'lucide-react';

export default function ScreenViewer({ agentId, socket, onClose }) {
    const [frameData, setFrameData] = useState(null);
    const [connecting, setConnecting] = useState(true);

    useEffect(() => {
        // Escuchar el stream de este agente
        const handleScreenFrame = (data) => {
            if (data.agent_id === agentId) {
                if (connecting) console.log("First frame received for:", agentId);
                setFrameData(`data:image/jpeg;base64,${data.frame}`);
                setConnecting(false);
            }
        };

        socket.on('agent_screen', handleScreenFrame);

        // Unirse a la sala y pedir al agente que empiece
        console.log("Emitting join_stream for:", agentId);
        socket.emit('join_stream', { agent_id: agentId });

        return () => {
            // Limpiar al cerrar
            socket.off('agent_screen', handleScreenFrame);
            socket.emit('leave_stream', { agent_id: agentId });
        };
    }, [agentId, socket]);

    return (
        <div className="viewer-overlay">
            <div className="viewer-content">
                <div className="viewer-header glass-panel" style={{ padding: '1rem', display: 'flex' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <MonitorPlay style={{ color: 'var(--accent)' }} />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Viewing {agentId}</h2>
                    </div>
                    <button className="btn-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="stream-container glass-panel">
                    {connecting && !frameData ? (
                        <div className="loader">
                            <div className="spinner"></div>
                            <span>Connecting to VDI Stream...</span>
                        </div>
                    ) : (
                        <img
                            src={frameData}
                            alt={`Screen of ${agentId}`}
                            className="stream-image"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
