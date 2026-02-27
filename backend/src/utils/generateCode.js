export const generateStudentCode = () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SV${year}${random}`;
};

export const generateTeacherCode = () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `GV${year}${random}`;
};

export const generateClassCode = () => {
  const random = Math.floor(100 + Math.random() * 900);
  return `L${random}`;
};

export const generateSubjectCode = (name) => {
  const prefix = name.substring(0, 2).toUpperCase();
  const random = Math.floor(100 + Math.random() * 900);
  return `${prefix}${random}`;
};
