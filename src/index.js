const express = require('express');
const cors = require('cors');
const { PrismaClient } = require("../generated/prisma");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.post('/api/users', async (req, res) => {
  const { name, email, password, company } = req.body;

  if (!name || !email || !password || !company?.name) {
    return res.status(400).json({ error: 'Field name, email, password, and company.name are required.' });
  }

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password, 
        company: {
          create: {
            name: company.name
          }
        }
      },
      include: {
        company: true
      }
    });

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan saat membuat user.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // Validasi input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password harus diisi.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true }
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    res.json({ message: 'Login berhasil', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan saat login.' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend berjalan di http://localhost:${PORT}`);
});
