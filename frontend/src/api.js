import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Employee API calls
export const employeeAPI = {
  getAll: () => api.get('/employees'),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  search: (keyword) => api.get(`/employees/search?keyword=${keyword}`)
};

export default api;