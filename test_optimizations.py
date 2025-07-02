#!/usr/bin/env python3
"""
Script de prueba para verificar las optimizaciones del backend
"""
import requests
import time
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8001"
TEST_USER = {"code": "test_user", "password": "test_password"}

def test_endpoint(endpoint, method="GET", data=None, headers=None, description=""):
    """Prueba un endpoint y mide el tiempo de respuesta"""
    print(f"\n🧪 Probando: {description or endpoint}")
    
    start_time = time.time()
    try:
        if method == "GET":
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(f"{BASE_URL}{endpoint}", json=data, headers=headers, timeout=10)
        
        end_time = time.time()
        response_time = (end_time - start_time) * 1000  # en milisegundos
        
        # Obtener tiempo del header si está disponible
        server_time = response.headers.get('X-Response-Time', 'N/A')
        
        print(f"   ✅ Status: {response.status_code}")
        print(f"   ⏱️  Cliente: {response_time:.1f}ms")
        print(f"   🖥️  Servidor: {server_time}")
        
        if response.status_code == 200:
            return response.json(), response_time
        else:
            print(f"   ❌ Error: {response.text}")
            return None, response_time
            
    except Exception as e:
        end_time = time.time()
        response_time = (end_time - start_time) * 1000
        print(f"   ❌ Error de conexión: {str(e)}")
        return None, response_time

def main():
    print("🚀 Probando Optimizaciones del Backend")
    print("=" * 50)
    
    results = {}
    
    # 1. Probar estadísticas de rendimiento
    print("\n📊 1. ESTADÍSTICAS DE RENDIMIENTO")
    stats, time1 = test_endpoint("/stats/performance", description="Métricas del sistema")
    if stats:
        print(f"   📈 Total requests: {stats.get('performance_metrics', {}).get('total_requests', 0)}")
        print(f"   📊 Cache hits: {stats.get('performance_metrics', {}).get('cache_hits', 0)}")
        print(f"   📉 Cache misses: {stats.get('performance_metrics', {}).get('cache_misses', 0)}")
    
    # 2. Probar lista de usuarios (con cache)
    print("\n👥 2. LISTA DE USUARIOS (CON CACHE)")
    
    # Primera llamada (sin cache)
    users1, time2 = test_endpoint("/users/list", description="Primera llamada (sin cache)")
    
    # Segunda llamada (con cache)
    time.sleep(0.1)  # Pequeña pausa
    users2, time3 = test_endpoint("/users/list", description="Segunda llamada (con cache)")
    
    if time2 and time3:
        improvement = ((time2 - time3) / time2) * 100
        print(f"   🚀 Mejora con cache: {improvement:.1f}% más rápido")
    
    # 3. Probar endpoint que no existe (para verificar middleware)
    print("\n❌ 3. ENDPOINT INEXISTENTE")
    test_endpoint("/endpoint-que-no-existe", description="Verificar middleware de errores")
    
    # 4. Probar múltiples requests para cache
    print("\n🔄 4. MÚLTIPLES REQUESTS (VERIFICAR CACHE)")
    times = []
    for i in range(5):
        _, response_time = test_endpoint("/users/list", description=f"Request #{i+1}")
        if response_time:
            times.append(response_time)
        time.sleep(0.05)
    
    if times:
        avg_time = sum(times) / len(times)
        print(f"   📊 Tiempo promedio: {avg_time:.1f}ms")
        print(f"   📈 Tiempo min: {min(times):.1f}ms")
        print(f"   📉 Tiempo max: {max(times):.1f}ms")
    
    # 5. Verificar estadísticas finales
    print("\n📊 5. ESTADÍSTICAS FINALES")
    final_stats, _ = test_endpoint("/stats/performance", description="Métricas actualizadas")
    
    if final_stats and stats:
        initial_requests = stats.get('performance_metrics', {}).get('total_requests', 0)
        final_requests = final_stats.get('performance_metrics', {}).get('total_requests', 0)
        new_requests = final_requests - initial_requests
        
        print(f"   📈 Nuevos requests procesados: {new_requests}")
        print(f"   📊 Cache hits actuales: {final_stats.get('performance_metrics', {}).get('cache_hits', 0)}")
        print(f"   ⚡ Tiempo promedio actual: {final_stats.get('performance_metrics', {}).get('average_response_time', 0):.3f}s")
    
    print("\n" + "=" * 50)
    print("✅ Pruebas de optimización completadas!")
    print("\n💡 Para ver más detalles:")
    print(f"   🔗 {BASE_URL}/stats/performance")
    print("\n📝 Revisa los logs del servidor para más información sobre el rendimiento.")

if __name__ == "__main__":
    main() 