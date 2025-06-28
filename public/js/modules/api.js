// Funções para interagir com a API backend.

async function request(url, options) {
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Falha na requisição');
        }
        return result;
    } catch (error) {
        console.error('Erro na API:', error);
        Toastify({
            text: `Erro na operação: ${error.message}`,
            duration: 5000,
            gravity: "top",
            position: "right",
            style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }
        }).showToast();
        throw error; // Propaga o erro para quem chamou a função
    }
}

export async function buscarDados() {
    return request('/api/dados');
}

export async function salvarDados(dadosDoForm, rowIndex) {
    const url = rowIndex ? `/api/editar/${rowIndex}` : '/api/cadastrar';
    const method = rowIndex ? 'PUT' : 'POST';

    return request(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosDoForm)
    });
}

export async function excluirRegistro(rowIndex) {
    return request(`/api/excluir/${rowIndex}`, { method: 'DELETE' });
}