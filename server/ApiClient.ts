
class ApiClient {
  static async get(url: string) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`GET Request failed: ${response.statusText}`);
    return response.json();
  }

  static async post(url: string, data: any) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`POST Request failed: ${response.statusText}`);
    return response.json();
  }

  // Added delete method to resolve Property 'delete' does not exist error
  static async delete(url: string) {
    const response = await fetch(url, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`DELETE Request failed: ${response.statusText}`);
    return response.json();
  }
}

export default ApiClient;
