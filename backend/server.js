require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// User Schema for Login
const userSchema = new mongoose.Schema({
  userName: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('t_login', userSchema);

// Employee Schema
const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  designation: { type: String, required: true },
  gender: { type: String, required: true },
  course: [String],
  image: String,
  createDate: { type: Date, default: Date.now }
});

const Employee = mongoose.model('t_Employee', employeeSchema);

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ userName: username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, userName: user.userName },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        userName: user.userName
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


// Create default admin user if not exists
const createDefaultUser = async () => {
  try {
    const existingUser = await User.findOne({ userName: 'admin' });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = new User({
        userName: 'admin',
        password: hashedPassword
      });
      await adminUser.save();
      console.log('Default admin user created - Username: admin, Password: admin123');
    }
  } catch (error) {
    console.error('Error creating default user:', error);
  }
};

// Employee Routes
// Get all employees
app.get('/api/employees', authenticateToken, async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createDate: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create employee
app.post('/api/employees', authenticateToken, async (req, res) => {
  try {
    const { name, email, mobile, designation, gender, course } = req.body;

    // Check if email already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const employee = new Employee({
      name,
      email,
      mobile,
      designation,
      gender,
      course
    });

    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update employee
app.put('/api/employees/:id', authenticateToken, async (req, res) => {
  try {
    const { name, email, mobile, designation, gender, course } = req.body;
    
    // Check if email already exists (excluding current employee)
    const existingEmployee = await Employee.findOne({ 
      email, 
      _id: { $ne: req.params.id } 
    });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { name, email, mobile, designation, gender, course },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete employee
app.delete('/api/employees/:id', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Search employees
app.get('/api/employees/search', authenticateToken, async (req, res) => {
  try {
    const { keyword } = req.query;
    const employees = await Employee.find({
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } }
      ]
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT;

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  createDefaultUser();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});