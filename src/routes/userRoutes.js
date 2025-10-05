const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  createUserWithCompany,
  deleteUser,
  loginUser
} = require('../controllers/userController');

// GET /api/users - Get all users
router.get('/', getAllUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', getUserById);

// POST /api/users - Create new user
router.post('/', createUser);

// POST /api/users/with-company - Create new user with company
router.post('/with-company', createUserWithCompany);

// POST /api/users/login - Login user
router.post('/login', loginUser);

// DELETE /api/users/:id - Delete user by ID
router.delete('/:id', deleteUser);

module.exports = router;
