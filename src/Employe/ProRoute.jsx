import React from 'react';
import { Navigate } from 'react-router-dom';

const ProRoute = ({ children }) => {
  const token = localStorage.getItem('employe_token');
  return token ? children : <Navigate to="/employe/login" />;
};

export default ProRoute;