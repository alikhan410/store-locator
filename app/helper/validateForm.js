export function validateStore(values) {
  const errors = {};

  const requiredFields = ["name", "address", "city", "state", "zip", "phone"];

  requiredFields.forEach((field) => {
    if (!values[field]?.trim()) {
      errors[field] = `${field[0].toUpperCase() + field.slice(1)} is required`;
    }
  });

  // ZIP format check (5 digits or 5+4 format)
  if (values.zip && !/^\d{5}(-\d{4})?$/.test(values.zip.trim())) {
    errors.zip = "ZIP code is invalid";
  }

  return errors;
}
