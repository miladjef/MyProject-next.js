const normalizeEmail = (email = "") => String(email).trim().toLowerCase();
const normalizePhone = (phone = "") => String(phone).replace(/[\s()-]/g, "").trim();

const valiadteEmail = (email) => {
  const value = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const valiadtePhone = (phone) => {
  const value = normalizePhone(phone);
  return /^\+?[0-9]{10,15}$/.test(value);
};

const valiadtePassword = (password) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#?!@$%^&*\-])[^\s]{8,}$/.test(
    String(password || "")
  );
};

export {
  normalizeEmail,
  normalizePhone,
  valiadteEmail,
  valiadtePhone,
  valiadtePassword,
};
