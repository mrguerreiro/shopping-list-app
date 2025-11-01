import requests
import json

def test_debug():
    try:
        print("Testando rota de debug...")
        response = requests.get('http://localhost:5001/api/debug')
        print(f"Status: {response.status_code}")
        if response.ok:
            data = response.json()
            print("\nRotas disponíveis:")
            print(json.dumps(data['routes'], indent=2))
        else:
            print(f"Erro: {response.text}")
    except requests.exceptions.ConnectionError as e:
        print(f"Erro de conexão: {e}")
        print("Verifique se o servidor está rodando na porta 5001")
    except Exception as e:
        print(f"Erro: {e}")
        print(f"Tipo do erro: {type(e)}")

if __name__ == "__main__":
    test_debug()