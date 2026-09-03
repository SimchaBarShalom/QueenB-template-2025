import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AuthForm from "./AuthForm";

const initialValues = {
  email: "",
  password: "",
};

function LoginPage({ onLogin }) {
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (event) => {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/auth/login", values);
      onLogin(response.data.user);
      navigate("/profile");
    } catch (requestError) {
      const message = requestError.response?.data?.error || "הכניסה נכשלה. בדקי את הפרטים ונסי שוב.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      title="כניסה"
      subtitle="התחברי עם משתמש קיים כדי להגיע לפרופיל הבסיסי."
      fields={[
        { name: "email", label: "אימייל", type: "email" },
        { name: "password", label: "סיסמה", type: "password" },
      ]}
      values={values}
      onChange={handleChange}
      onSubmit={handleSubmit}
      submitLabel="כניסה"
      loading={loading}
      error={error}
    />
  );
}

export default LoginPage;
