/*produção
const API_BASE_URL = "http://localhost:3000";*/

const API_BASE_URL = "https://medical-system-lg24.onrender.com";

function getAuthToken() {
  return sessionStorage.getItem("authToken");
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || result.error || "Falha na requisição");
    }
    return result;
  } catch (error) {
    console.error("Erro na API:", error);
    Toastify({
      text: `Erro: ${error.message}`,
      duration: 5000,
      gravity: "top",
      position: "right",
      style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" },
    }).showToast();
    throw error;
  }
}

export async function buscarDados() {
  return request("/api/dados");
}

export async function requestCode(email) {
  return request("/api/auth/request-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyCode(email, code) {
  return request("/api/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function salvarDados(dadosDoForm, rowIndex) {
  const url = rowIndex ? `/api/editar/${rowIndex}` : "/api/cadastrar";
  const method = rowIndex ? "PUT" : "POST";

  return request(url, {
    method: method,
    body: JSON.stringify(dadosDoForm),
  });
}

export async function excluirRegistro(rowIndex) {
  return request(`/api/excluir/${rowIndex}`, { method: "DELETE" });
}