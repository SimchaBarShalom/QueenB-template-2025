function getRequestErrorMessage(error, fallbackMessage) {
  const errors = error.response?.data?.errors;

  if (Array.isArray(errors) && errors.length > 0) {
    return errors.join(". ");
  }

  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.request) {
    return "לא ניתן להתחבר לשרת. ודאי שהשרת רץ על http://localhost:5000.";
  }

  return fallbackMessage;
}

export default getRequestErrorMessage;
