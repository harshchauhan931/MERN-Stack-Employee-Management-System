import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

function Dashboard() {
  const { user, logout } = useAuth();
  
  // Load employees from localStorage on component mount
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('employees');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    designation: 'HR',
    gender: 'M',
    course: [],
    image: null
  });
  const [errors, setErrors] = useState({});

  // Save employees to localStorage whenever employees array changes
  useEffect(() => {
    localStorage.setItem('employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchKeyword]);

  const filterEmployees = () => {
    if (!searchKeyword) {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchKeyword.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
    setCurrentPage(1);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Check for duplicate email
    const duplicateEmail = employees.find(emp => 
      emp.email.toLowerCase() === formData.email.toLowerCase() && 
      emp._id !== editingEmployee?._id
    );
    if (duplicateEmail) {
      newErrors.email = 'Email already exists';
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile is required';
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Mobile must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingEmployee) {
        // Update existing employee
        const updatedEmployees = employees.map(emp => 
          emp._id === editingEmployee._id 
            ? { ...formData, _id: editingEmployee._id, createDate: emp.createDate }
            : emp
        );
        setEmployees(updatedEmployees);
      } else {
        // Create new employee
        const newEmployee = {
          ...formData,
          _id: Date.now().toString(), // Simple ID generation
          createDate: new Date().toISOString()
        };
        setEmployees([...employees, newEmployee]);
      }
      
      resetForm();
      setShowForm(false);
      alert('Employee saved successfully!');
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Error saving employee');
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      mobile: employee.mobile,
      designation: employee.designation,
      gender: employee.gender,
      course: employee.course || [],
      image: null
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        setEmployees(employees.filter(emp => emp._id !== id));
        alert('Employee deleted successfully!');
      } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Error deleting employee');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      mobile: '',
      designation: 'HR',
      gender: 'M',
      course: [],
      image: null
    });
    setEditingEmployee(null);
    setShowForm(false);
    setErrors({});
  };

  const handleCourseChange = (course) => {
    const updatedCourses = formData.course.includes(course)
      ? formData.course.filter(c => c !== course)
      : [...formData.course, course];
    setFormData({ ...formData, course: updatedCourses });
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="header">
        <div className="logo">Logo</div>
        <nav className="nav">
          <span>Home</span>
          <span>Employee List</span>
          <span>{user?.userName || 'Admin'}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </nav>
      </header>

      <div className="main-content">
        <h1>Welcome Admin Panel</h1>

        {!showForm ? (
          <div className="employee-section">
            {/* Controls */}
            <div className="controls">
              <div className="total-count">
                Total Count: {filteredEmployees.length}
              </div>
              <button onClick={() => setShowForm(true)} className="create-btn">
                Create Employee
              </button>
            </div>

            {/* Search */}
            <div className="search-section">
              <input
                type="text"
                placeholder="Enter Search Keyword"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Employee List */}
            <div className="employee-table">
              <table>
                <thead>
                  <tr>
                    <th>Unique Id</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile No</th>
                    <th>Designation</th>
                    <th>Gender</th>
                    <th>Course</th>
                    <th>Create Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? currentItems.map((employee, index) => (
                    <tr key={employee._id}>
                      <td>{indexOfFirstItem + index + 1}</td>
                      <td>
                        {employee.image ? (
                          <img src={employee.image} alt="Employee" width="40" height="40" />
                        ) : (
                          'No Image'
                        )}
                      </td>
                      <td>{employee.name}</td>
                      <td>{employee.email}</td>
                      <td>{employee.mobile}</td>
                      <td>{employee.designation}</td>
                      <td>{employee.gender === 'M' ? 'Male' : 'Female'}</td>
                      <td>{employee.course?.join(', ')}</td>
                      <td>{new Date(employee.createDate).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => handleEdit(employee)} className="edit-btn">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(employee._id)} className="delete-btn">
                          Delete
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="10" style={{textAlign: 'center'}}>No employees found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={currentPage === i + 1 ? 'active' : ''}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Employee Form */
          <div className="employee-form-section">
            <h2>{editingEmployee ? 'Edit Employee' : 'Create Employee'}</h2>
            <form onSubmit={handleSubmit} className="employee-form">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
                {errors.name && <span className="error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                {errors.email && <span className="error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label>Mobile No</label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                />
                {errors.mobile && <span className="error">{errors.mobile}</span>}
              </div>

              <div className="form-group">
                <label>Designation</label>
                <select
                  value={formData.designation}
                  onChange={(e) => setFormData({...formData, designation: e.target.value})}
                >
                  <option value="HR">HR</option>
                  <option value="Manager">Manager</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>

              <div className="form-group">
                <label>Gender</label>
                <div>
                  <input
                    type="radio"
                    id="male"
                    name="gender"
                    value="M"
                    checked={formData.gender === 'M'}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  />
                  <label htmlFor="male">Male</label>
                  <input
                    type="radio"
                    id="female"
                    name="gender"
                    value="F"
                    checked={formData.gender === 'F'}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  />
                  <label htmlFor="female">Female</label>
                </div>
              </div>

              <div className="form-group">
                <label>Course</label>
                <div>
                  {['MCA', 'BCA', 'BSC'].map(course => (
                    <label key={course}>
                      <input
                        type="checkbox"
                        checked={formData.course.includes(course)}
                        onChange={() => handleCourseChange(course)}
                      />
                      {course}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Image Upload</label>
                <input
                  type="file"
                  accept=".jpg,.png"
                  onChange={(e) => setFormData({...formData, image: e.target.files[0]})}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  {editingEmployee ? 'Update' : 'Submit'}
                </button>
                <button type="button" onClick={resetForm} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;