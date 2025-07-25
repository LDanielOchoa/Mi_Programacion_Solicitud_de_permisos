const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export async function fetchRequests() {
  const response = await fetch(`${API_URL}/requests`);

  if (!response.ok) {
    throw new Error('Error al obtener las solicitudes');
  }

  return response.json();
}

export async function updateRequestStatus(
  id: string,
  action: 'approve' | 'reject',
  reason: string
) {
  const response = await fetch(`${API_URL}/admin/requests/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: action === 'approve' ? 'approved' : 'rejected',
      respuesta: reason
    })
  });

  if (!response.ok) {
    throw new Error('Error al actualizar la solicitud');
  }

  return response.json();
}

export async function deleteRequest(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/admin/requests/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Error al eliminar la solicitud');
  }
}
