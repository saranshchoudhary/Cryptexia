// Required dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Added CORS
const bcrypt = require('bcryptjs'); // Use bcryptjs instead of bcrypt
const jwt = require('jsonwebtoken');
const app = express();
const PORT = 3000;

// Mock Database
const users = [];

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS

// Utility functions for encryption algorithms
const caesarCipher = (text, shift) => {
  return text
    .split('')
    .map(char => {
      if (char.match(/[a-z]/i)) {
        const code = char.charCodeAt(0);
        const base = code >= 65 && code <= 90 ? 65 : 97;
        return String.fromCharCode(((code - base + shift) % 26) + base);
      }
      return char;
    })
    .join('');
};
const vigenereCipher = (text, key) => {
  let result = '';
  let keyIndex = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char.match(/[a-z]/i)) {
      const base = char >= 'a' ? 97 : 65;
      const shift = key[keyIndex % key.length].toLowerCase().charCodeAt(0) - 97;
      result += String.fromCharCode(((char.charCodeAt(0) - base + shift) % 26) + base);
      keyIndex++;
    } else {
      result += char;
    }
  }
  return result;
};
// Rail Fence Cipher
const railFenceCipher = (text, rails) => {
    const fence = Array(rails).fill().map(() => Array(text.length).fill('\n'));
    let rail = 0;
    let direction = 1;
    
    for (let i = 0; i < text.length; i++) {
        fence[rail][i] = text[i];
        rail += direction;
        if (rail === rails - 1 || rail === 0) {
            direction *= -1;
        }
    }
    
    return fence.map(row => row.join('')).join('').replace(/\n/g, '');
};

// Playfair Cipher (Simple Implementation)
// Playfair Cipher
const generatePlayfairKeySquare = (keyword) => {
  let key = keyword.toUpperCase().replace(/J/g, "I"); // Replace J with I
  let alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
  let keySquare = [];
  let usedChars = new Set();

  key += alphabet; // Append the full alphabet

  for (let char of key) {
    if (!usedChars.has(char) && keySquare.length < 25) {
      keySquare.push(char);
      usedChars.add(char);
    }
  }

  return keySquare;
};

const findPosition = (char, keySquare) => {
  let index = keySquare.indexOf(char);
  return [Math.floor(index / 5), index % 5]; // row, column
};

const playfairCipher = (text, keyword, encrypt = true) => {
  let keySquare = generatePlayfairKeySquare(keyword);
  let processedText = text.toUpperCase().replace(/J/g, "I").replace(/[^A-Z]/g, "");
  let result = "";
  let pairs = [];

  for (let i = 0; i < processedText.length; i += 2) {
    let a = processedText[i];
    let b = processedText[i + 1] || "X";

    if (a === b) {
      pairs.push([a, "X"]);
      i--;
    } else {
      pairs.push([a, b]);
    }
  }

  for (let [a, b] of pairs) {
    let [rowA, colA] = findPosition(a, keySquare);
    let [rowB, colB] = findPosition(b, keySquare);

    if (rowA === rowB) {
      colA = (colA + (encrypt ? 1 : 4)) % 5;
      colB = (colB + (encrypt ? 1 : 4)) % 5;
    } else if (colA === colB) {
      rowA = (rowA + (encrypt ? 1 : 4)) % 5;
      rowB = (rowB + (encrypt ? 1 : 4)) % 5;
    } else {
      [colA, colB] = [colB, colA];
    }

    result += keySquare[rowA * 5 + colA] + keySquare[rowB * 5 + colB];
  }

  return result;
};

// Beaufort Cipher
const beaufortCipher = (text, key) => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char.match(/[a-z]/i)) {
      const base = char >= 'a' ? 97 : 65;
      const shift = key[i % key.length].toLowerCase().charCodeAt(0) - 97;
      result += String.fromCharCode(((shift - (char.charCodeAt(0) - base) + 26) % 26) + base);
    } else {
      result += char;
    }
  }
  return result;
};

// Autokey Cipher
const autokeyCipher = (text, key) => {
  let result = '';
  let fullKey = key + text;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char.match(/[a-z]/i)) {
      const base = char >= 'a' ? 97 : 65;
      const shift = fullKey[i].toLowerCase().charCodeAt(0) - 97;
      result += String.fromCharCode(((char.charCodeAt(0) - base + shift) % 26) + base);
    } else {
      result += char;
    }
  }
  return result;
};
// Add more cipher functions like Rail Fence, Playfair, Beaufort, Autokey
// Route to handle encryption
app.post('/encrypt', (req, res) => {
  const { password, algorithm } = req.body;
  if (!password || !algorithm) {
    return res.status(400).json({ message: 'Password and algorithm are required.' });
  }

  let encryptedPassword;
  try {
    switch (algorithm) {
      case 'caesar':
        encryptedPassword = caesarCipher(password, 3);
        break;
      case 'vigenere':
        encryptedPassword = vigenereCipher(password, 'key');
        break;
      case 'railfence':
        encryptedPassword = railFenceCipher(password, 3);
        break;
      case 'playfair':
        encryptedPassword = playfairCipher(password, 'key');
        break;
      case 'beaufort':
        encryptedPassword = beaufortCipher(password, 'key');
        break;
      case 'autokey':
        encryptedPassword = autokeyCipher(password, 'key');
        break;
      default:
        return res.status(400).json({ message: 'Unsupported encryption algorithm.' });
    }
    res.json({ encryptedPassword });
  } catch (error) {
    res.status(500).json({ message: 'Encryption failed.', error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
