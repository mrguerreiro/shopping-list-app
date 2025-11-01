import requests
import sys

def test_route():
    try:
    print("Testando rota de status...")
    response = requests.get('http://localhost:5001/api/status')
    print(f"Status: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    print(f"Resposta: {response.text}\n")

    except requests.exceptions.ConnectionError as e:
        print(f"Erro de conexão: {e}")
        print("Verifique se o servidor está rodando na porta 5001")
    except Exception as e:
        print(f"Erro: {e}")
        print(f"Tipo do erro: {type(e)}")

if __name__ == "__main__":
    test_route()