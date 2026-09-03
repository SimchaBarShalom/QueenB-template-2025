import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AuthForm from "./AuthForm";

const initialValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
};

const roleContent = {
  MENTEE: {
    title: "הרשמת חניכה",
    subtitle: "צרי משתמש בסיסי בתפקיד חניכה.",
  },
  MENTOR: {
    title: "הרשמת מנטורית",
    subtitle: "צרי משתמש בסיסי בתפקיד מנטורית.",
  },
};

function RegisterPage({ role, onRegister }) {
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const content = roleContent[role];

  const handleChange = (event) => {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/auth/register", { ...values, role });
      onRegister(response.data.user);
      navigate("/profile");
    } catch (requestError) {
      const errors = requestError.response?.data?.errors;
      const message =
        requestError.response?.data?.error ||
        (Array.isArray(errors) ? errors.join(". ") : "ההרשמה נכשלה. בדקי את הפרטים ונסי שוב.");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      title={content.title}
      subtitle={content.subtitle}
      fields={[
        { name: "firstName", label: "שם פרטי" },
        { name: "lastName", label: "שם משפחה" },
        { name: "email", label: "אימייל", type: "email" },
        { name: "password", label: "סיסמה", type: "password" },
      ]}
      values={values}
      onChange={handleChange}
      onSubmit={handleSubmit}
      submitLabel="הרשמה"
      loading={loading}
      error={error}
    />
  );
}

export default RegisterPage;
