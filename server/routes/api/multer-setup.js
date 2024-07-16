const multer = require('multer');
const path = require('path');

// Налаштування зберігання
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Вкажіть шлях до папки, де будуть зберігатися зображення
    cb(null, '/uploads/');
  },
  filename: (req, file, cb) => {
    // Використовуємо унікальне ім'я для файлу
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Фільтр для перевірки типу файлу
const fileFilter = (req, file, cb) => {
  // Приймаємо тільки зображення з форматами jpg, jpeg та png
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG and PNG are allowed!'), false);
  }
};

// Налаштування Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Обмеження розміру файлу 5MB
  fileFilter: fileFilter
});

module.exports = upload;
