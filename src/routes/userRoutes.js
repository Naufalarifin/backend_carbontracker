const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  createUserWithCompany,
  deleteUser,
  loginUser,
  checkUserCompany
} = require('../controllers/userController');
const { authenticateUser } = require('../middleware/authMiddleware');

// GET /api/users - Get all users (requires login)
router.get('/', authenticateUser, getAllUsers);

// GET /api/users/:id - Get user by ID (requires login)
router.get('/:id', authenticateUser, getUserById);

// POST /api/users/register - Create new user (PUBLIC - no auth required)
router.post('/register', createUser);

// POST /api/users/with-company - Create new user with company (PUBLIC - no auth required)
router.post('/with-company', createUserWithCompany);

// POST /api/users/login - Login user (PUBLIC - no auth required)
router.post('/login', loginUser);

// GET /api/users/company-status - Check if user has company (requires login)
router.get('/company-status', authenticateUser, checkUserCompany);

// DELETE /api/users/:id - Delete user by ID (requires login)
router.delete('/:id', authenticateUser, deleteUser);

module.exports = router;
