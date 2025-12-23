class ApiClient {
  static async get(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GET ${url} failed (${response.status}): ${errorText || response.statusText}`);
    }
    return response.json();
  }

  static async post(url: string, data: any) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`POST ${url} failed (${response.status}): ${errorText || response.statusText}`);
    }
    return response.json();
  }

  // Added delete method to fix your AppContext error
  static async delete(url: string) {
    const response = await fetch(url, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DELETE ${url} failed (${response.status}): ${errorText || response.statusText}`);
    }
    return response.status !== 204 ? response.json() : null;
  }
}

export default ApiClient;