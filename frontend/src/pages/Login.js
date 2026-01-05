import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, MapPin } from 'lucide-react';
import './Login.css';

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    zona: ''
  });

  const { login, register, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let result;
    if (isRegister) {
      result = await register(formData);
    } else {
      result = await login(formData.email, formData.password);
    }

    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left side - Branding */}
        <div className="login-branding">
          <div className="branding-content">
            <h1 className="brand-logo">EFEX</h1>
            <p className="brand-tagline">Copiloto para Promotores</p>
            <div className="brand-features">
              <div className="feature-item">
                <span className="feature-icon">🤖</span>
                <span>IA que te ayuda a vender mas</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📈</span>
                <span>Automatiza tu atencion al cliente</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💰</span>
                <span>Aumenta tus ingresos</span>
              </div>
            </div>
          </div>
          <div className="branding-footer">
            <p>Powered by Claude Opus 4.5</p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="login-form-container">
          <div className="form-header">
            <h2>{isRegister ? 'Crear cuenta' : 'Iniciar sesion'}</h2>
            <p className="text-muted">
              {isRegister
                ? 'Registrate como promotor EFEX'
                : 'Bienvenido de vuelta'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {isRegister && (
              <>
                <div className="form-group">
                  <label htmlFor="name">Nombre completo</label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Tu nombre"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="zona">Zona de operacion</label>
                  <div className="input-wrapper">
                    <MapPin size={18} className="input-icon" />
                    <input
                      type="text"
                      id="zona"
                      name="zona"
                      value={formData.zona}
                      onChange={handleChange}
                      placeholder="Ej: CDMX Norte"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="email">Correo electronico</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Contrasena</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner"></span>
              ) : (
                isRegister ? 'Crear cuenta' : 'Iniciar sesion'
              )}
            </button>
          </form>

          <div className="form-footer">
            <p>
              {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
              <button
                type="button"
                className="toggle-form-btn"
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? 'Iniciar sesion' : 'Registrate'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
