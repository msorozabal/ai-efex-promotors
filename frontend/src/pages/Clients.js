import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { clientsAPI, copilotAPI } from '../services/api';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  MessageSquare,
  TrendingUp,
  X,
  Phone,
  Mail,
  Building,
  FileText
} from 'lucide-react';
import './Clients.css';

function Clients() {
  const [searchParams] = useSearchParams();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(searchParams.get('new') === 'true');
  const [editingClient, setEditingClient] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    business_name: '',
    business_type: '',
    status: 'prospecto',
    notes: ''
  });

  useEffect(() => {
    fetchClients();
  }, [statusFilter]);

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getAll(statusFilter || null);
      setClients(response.data.clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await clientsAPI.update(editingClient.id, formData);
      } else {
        await clientsAPI.create(formData);
      }
      fetchClients();
      closeModal();
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estas seguro de eliminar este cliente?')) {
      try {
        await clientsAPI.delete(id);
        fetchClients();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const handleAnalyze = async (client) => {
    setAnalyzing(client.id);
    try {
      const response = await copilotAPI.analyzeOpportunity(client.id);
      alert(response.data.analysis);
    } catch (error) {
      console.error('Error analyzing client:', error);
    } finally {
      setAnalyzing(null);
    }
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      business_name: client.business_name || '',
      business_type: client.business_type || '',
      status: client.status,
      notes: client.notes || ''
    });
    setShowModal(true);
    setActiveMenu(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      business_name: '',
      business_type: '',
      status: 'prospecto',
      notes: ''
    });
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'activo': return 'badge-active';
      case 'prospecto': return 'badge-prospect';
      default: return 'badge-inactive';
    }
  };

  return (
    <div className="clients-page">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1>Clientes</h1>
          <p className="text-muted">Gestiona tu cartera de clientes y prospectos</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Nuevo Cliente
        </button>
      </header>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, negocio o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="prospecto">Prospectos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Clients List */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando clientes...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">📋</div>
          <h3>No hay clientes</h3>
          <p>
            {searchTerm || statusFilter
              ? 'No se encontraron clientes con esos criterios'
              : 'Agrega tu primer cliente para comenzar'}
          </p>
          {!searchTerm && !statusFilter && (
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} />
              Agregar cliente
            </button>
          )}
        </div>
      ) : (
        <div className="clients-grid">
          {filteredClients.map((client) => (
            <div key={client.id} className="client-card card">
              <div className="client-header">
                <div className="client-avatar">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="client-info">
                  <h3>{client.name}</h3>
                  <span className={`badge ${getStatusBadgeClass(client.status)}`}>
                    {client.status}
                  </span>
                </div>
                <div className="client-menu">
                  <button
                    className="menu-trigger"
                    onClick={() => setActiveMenu(activeMenu === client.id ? null : client.id)}
                  >
                    <MoreVertical size={18} />
                  </button>
                  {activeMenu === client.id && (
                    <div className="menu-dropdown">
                      <button onClick={() => openEditModal(client)}>
                        <Edit2 size={14} /> Editar
                      </button>
                      <Link to={`/copilot?client=${client.id}`}>
                        <MessageSquare size={14} /> Pedir ayuda
                      </Link>
                      <button
                        onClick={() => handleAnalyze(client)}
                        disabled={analyzing === client.id}
                      >
                        <TrendingUp size={14} />
                        {analyzing === client.id ? 'Analizando...' : 'Analizar'}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(client.id)}
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="client-details">
                {client.business_name && (
                  <div className="detail-item">
                    <Building size={14} />
                    <span>{client.business_name}</span>
                  </div>
                )}
                {client.email && (
                  <div className="detail-item">
                    <Mail size={14} />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="detail-item">
                    <Phone size={14} />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.notes && (
                  <div className="detail-item notes">
                    <FileText size={14} />
                    <span>{client.notes}</span>
                  </div>
                )}
              </div>

              <div className="client-actions">
                <button className="btn-outline" onClick={() => openEditModal(client)}>
                  <Edit2 size={14} />
                  Editar
                </button>
                <Link to={`/copilot`} className="btn-secondary">
                  <MessageSquare size={14} />
                  Copiloto
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close menu */}
      {activeMenu && (
        <div className="menu-overlay" onClick={() => setActiveMenu(null)} />
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button className="close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nombre del contacto"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="prospecto">Prospecto</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="form-group">
                  <label>Telefono</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+52 55 1234 5678"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nombre del Negocio</label>
                  <input
                    type="text"
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                    placeholder="Empresa ABC"
                  />
                </div>
                <div className="form-group">
                  <label>Tipo de Negocio</label>
                  <input
                    type="text"
                    value={formData.business_type}
                    onChange={(e) => setFormData({...formData, business_type: e.target.value})}
                    placeholder="Importadora, Retail, etc."
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Notas adicionales sobre el cliente..."
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clients;
