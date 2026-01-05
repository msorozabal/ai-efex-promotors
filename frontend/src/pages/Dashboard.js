import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, clientsAPI } from '../services/api';
import {
  Users,
  UserCheck,
  UserPlus,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Clock
} from 'lucide-react';
import './Dashboard.css';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentClients, setRecentClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, clientsRes] = await Promise.all([
          dashboardAPI.getStats(),
          clientsAPI.getAll()
        ]);

        setStats(statsRes.data.stats);
        setRecentClients(clientsRes.data.clients.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos dias';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const statCards = [
    {
      icon: Users,
      label: 'Total Clientes',
      value: stats?.total_clients || 0,
      color: 'blue'
    },
    {
      icon: UserCheck,
      label: 'Clientes Activos',
      value: stats?.active_clients || 0,
      color: 'green'
    },
    {
      icon: UserPlus,
      label: 'Prospectos',
      value: stats?.prospects || 0,
      color: 'yellow'
    },
    {
      icon: MessageSquare,
      label: 'Conversaciones',
      value: stats?.conversations || 0,
      color: 'purple'
    }
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>{getGreeting()}, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-muted">
            Aqui tienes un resumen de tu actividad como promotor EFEX
          </p>
        </div>
        <Link to="/copilot" className="btn-primary quick-action">
          <MessageSquare size={18} />
          Abrir Copiloto
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className={`stat-card stat-${stat.color}`}>
            <div className="stat-icon">
              <stat.icon size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Quick Actions */}
        <div className="card quick-actions-card">
          <h3>Acciones Rapidas</h3>
          <div className="quick-actions-list">
            <Link to="/copilot" className="quick-action-item">
              <div className="action-icon">
                <MessageSquare size={20} />
              </div>
              <div className="action-content">
                <span className="action-title">Hablar con el Copiloto</span>
                <span className="action-desc">Pide ayuda con mensajes, propuestas y mas</span>
              </div>
              <ArrowRight size={18} className="action-arrow" />
            </Link>

            <Link to="/clients?new=true" className="quick-action-item">
              <div className="action-icon">
                <UserPlus size={20} />
              </div>
              <div className="action-content">
                <span className="action-title">Agregar Cliente</span>
                <span className="action-desc">Registra un nuevo prospecto o cliente</span>
              </div>
              <ArrowRight size={18} className="action-arrow" />
            </Link>

            <Link to="/clients" className="quick-action-item">
              <div className="action-icon">
                <TrendingUp size={20} />
              </div>
              <div className="action-content">
                <span className="action-title">Ver Prospectos</span>
                <span className="action-desc">Revisa y da seguimiento a prospectos</span>
              </div>
              <ArrowRight size={18} className="action-arrow" />
            </Link>
          </div>
        </div>

        {/* Recent Clients */}
        <div className="card recent-clients-card">
          <div className="card-header">
            <h3>Clientes Recientes</h3>
            <Link to="/clients" className="view-all-link">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>

          {recentClients.length > 0 ? (
            <div className="clients-list">
              {recentClients.map((client) => (
                <Link
                  key={client.id}
                  to={`/clients/${client.id}`}
                  className="client-item"
                >
                  <div className="client-avatar">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="client-info">
                    <span className="client-name">{client.name}</span>
                    <span className="client-business">{client.business_name || 'Sin negocio'}</span>
                  </div>
                  <span className={`badge badge-${client.status === 'activo' ? 'active' : client.status === 'prospecto' ? 'prospect' : 'inactive'}`}>
                    {client.status}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Users size={48} className="empty-icon" />
              <p>No tienes clientes registrados</p>
              <Link to="/clients?new=true" className="btn-primary">
                Agregar primer cliente
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Copilot Promo */}
      <div className="copilot-promo card">
        <div className="promo-content">
          <div className="promo-icon">🤖</div>
          <div className="promo-text">
            <h3>Tu Copiloto AI esta listo</h3>
            <p>
              Pide ayuda para redactar mensajes, analizar oportunidades,
              preparar propuestas y mucho mas.
            </p>
          </div>
          <Link to="/copilot" className="btn-primary">
            Comenzar a chatear
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
